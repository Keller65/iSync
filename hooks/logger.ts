import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

// Directorios
const INTERNAL_LOG_DIR = `${FileSystem.documentDirectory}logs/`;
const ASYNC_STORAGE_LOG_KEY = "@isync:logs";
const CURRENT_LOG_FILE_KEY = "@isync:current_log_file";
const EXTERNAL_FOLDER_NAME = "iSyncLogs";

// Variable global para almacenar el URI del directorio externo (por defecto interno)
let externalLogDir: string = INTERNAL_LOG_DIR;

// Función para obtener permisos y crear carpeta en almacenamiento externo
async function getOrCreateExternalLogDir(): Promise<string> {
  if (externalLogDir) {
    return externalLogDir;
  }

  try {
    if (Platform.OS === 'android') {
      // Solicitar permisos para acceder al almacenamiento
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const baseDir = permissions.directoryUri;

        // Verificar si la carpeta iSyncLogs ya existe
        const existingFolders = await FileSystem.StorageAccessFramework.readDirectoryAsync(baseDir);
        const logsFolder = existingFolders.find(item =>
          item.endsWith(EXTERNAL_FOLDER_NAME)
        );

        if (logsFolder) {
          externalLogDir = logsFolder;
        } else {
          // No existe la carpeta; usar el directorio base como ubicación externa
          // (Expo SAF no provee createFolderAsync, por lo que guardaremos directamente en baseDir)
          externalLogDir = baseDir;
        }

        return externalLogDir;
      } else {
        throw new Error('Permisos de almacenamiento denegados');
      }
    } else {
      // En iOS, usar el directorio de documentos con subcarpeta
      const iosLogDir = `${FileSystem.documentDirectory}${EXTERNAL_FOLDER_NAME}/`;
      const dirInfo = await FileSystem.getInfoAsync(iosLogDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(iosLogDir, { intermediates: true });
      }

      externalLogDir = iosLogDir;
      return externalLogDir;
    }
  } catch (error) {
    console.error('Error creando directorio externo:', error);
    // Fallback al directorio interno
    return INTERNAL_LOG_DIR;
  }
}

// Función para obtener la ruta del archivo de log actual
export async function getCurrentLogFilePath(): Promise<{ fileUri: string; fileName: string }> {
  try {
    const externalDir = await getOrCreateExternalLogDir();
    const fileName = getCurrentLogFileName();

    if (Platform.OS === 'android' && externalDir !== INTERNAL_LOG_DIR) {
      // En Android con permisos externos
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        externalDir,
        fileName,
        'text/plain'
      );
      return { fileUri, fileName };
    } else {
      // En iOS o fallback a interno
      const fileUri = `${externalDir}${fileName}`;
      return { fileUri, fileName };
    }
  } catch (error) {
    console.error('Error obteniendo ruta externa, usando interna:', error);
    // Fallback al directorio interno
    const fileName = getCurrentLogFileName();
    const fileUri = `${INTERNAL_LOG_DIR}${fileName}`;
    return { fileUri, fileName };
  }
}

async function ensureInternalLogDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(INTERNAL_LOG_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(INTERNAL_LOG_DIR, { intermediates: true });
  }
}

async function appendToFileAsync(fileUri: string, text: string) {
  try {
    // Para archivos externos en Android, necesitamos un enfoque diferente
    if (Platform.OS === 'android' && fileUri.startsWith('content://')) {
      // Leer contenido existente
      const current = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      }).catch(() => "");

      const combined = current + text;

      // Sobrescribir el archivo completo
      await FileSystem.writeAsStringAsync(fileUri, combined, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      // Para archivos internos o iOS
      const current = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      }).catch(() => "");
      const combined = current + text;
      await FileSystem.writeAsStringAsync(fileUri, combined, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch (e) {
    if (__DEV__) {
      console.log("Error appending to file:", e);
    }
    throw e;
  }
}

function getCurrentLogFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `isync-log-${yyyy}-${mm}-${dd}.txt`;
}

async function getCurrentLogFile(): Promise<string> {
  await ensureInternalLogDirExists();

  // Obtener el archivo actual guardado
  const savedFileInfo = await AsyncStorage.getItem(CURRENT_LOG_FILE_KEY);

  if (savedFileInfo) {
    try {
      const { fileName, date, fileUri } = JSON.parse(savedFileInfo);
      const savedDate = new Date(date);
      const currentDate = new Date();

      // Verificar si es el mismo día (misma fecha)
      const isSameDay =
        savedDate.getFullYear() === currentDate.getFullYear() &&
        savedDate.getMonth() === currentDate.getMonth() &&
        savedDate.getDate() === currentDate.getDate();

      if (isSameDay && fileUri) {
        // Verificar si el archivo aún existe
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          return fileUri;
        }
      }
    } catch (error) {
      console.log("Error parsing saved file info:", error);
    }
  }

  // Crear nuevo archivo para el día actual
  const { fileUri, fileName } = await getCurrentLogFilePath();

  // Guardar información del nuevo archivo
  await AsyncStorage.setItem(CURRENT_LOG_FILE_KEY, JSON.stringify({
    fileName: fileName,
    fileUri: fileUri,
    date: new Date().toISOString()
  }));

  // Crear el archivo con encabezado
  let header = `=== LOG FILE CREATED: ${new Date().toISOString()} ===\n`;
  header += `=== STORAGE: ${fileUri.includes('content://') ? 'EXTERNAL' : 'INTERNAL'} ===\n\n`;

  await FileSystem.writeAsStringAsync(fileUri, header, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}

export type UserActionLog = {
  section: "PEDIDO" | "COBRO" | "SESSION" | "UI" | "UBICACION" | "CATALOGO" | "CLIENTES" | "DETALLES" | string;
  event: string;
  userId?: string | number;
  isEditing?: boolean;
  URL?: string;
  date?: string;
  documentId?: number | string;
  payload?: Record<string, any>;
  createdAt?: string;
};

function formatDate(dateInput?: string | Date) {
  const date = dateInput ? new Date(dateInput) : new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${period}`;
}

function formatLogLine(entry: UserActionLog) {
  const timestamp = formatDate(entry.createdAt);

  const header = `${timestamp} | ${entry.section} | ${entry.event}`;

  const meta = Object.entries(entry)
    .filter(([key, value]) =>
      value != null &&
      !["createdAt", "section", "event"].includes(key)
    )
    .filter(([, value]) => typeof value !== "object")
    .map(([key, value]) => `  ${key.padEnd(12)}: ${value}`);

  const objects = Object.entries(entry)
    .filter(([, value]) => value != null && typeof value === "object")
    .map(
      ([key, value]) =>
        `  ${key}:\n${JSON.stringify(value, null, 2)
          .split("\n")
          .map(line => `    ${line}`)
          .join("\n")}`
    );

  return [
    "────────────────────────────────────────────",
    header,
    ...meta,
    ...objects,
  ].join("\n");
}

/**
 * Guarda el log también en AsyncStorage, en un array JSON.
 */
async function saveLogInAsyncStorage(entry: UserActionLog) {
  try {
    const existing = await AsyncStorage.getItem(ASYNC_STORAGE_LOG_KEY);
    let logs: UserActionLog[] = [];

    if (existing) {
      try {
        logs = JSON.parse(existing);
      } catch {
        logs = [];
      }
    }

    const logWithTimestamp: UserActionLog = {
      ...entry,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };

    logs.push(logWithTimestamp);

    // opcional: limitar el tamaño para que no crezca infinito
    const MAX_LOGS = 500;
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(logs.length - MAX_LOGS);
    }

    await AsyncStorage.setItem(ASYNC_STORAGE_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    if (__DEV__) {
      console.log("Error saving log to AsyncStorage:", error);
    }
  }
}

export async function logUserAction(entry: UserActionLog) {
  try {
    await ensureInternalLogDirExists();

    // Obtener el archivo actual (crea uno nuevo si es necesario)
    const fileUri = await getCurrentLogFile();

    const enrichedEntry: UserActionLog = {
      ...entry,
      createdAt: new Date().toISOString(),
    };

    const line = formatLogLine(enrichedEntry);

    // 1) Guardar en archivo .txt del día actual
    await appendToFileAsync(fileUri, line + "\n");

    // 2) Guardar en AsyncStorage como JSON estructurado
    await saveLogInAsyncStorage(enrichedEntry);

    if (__DEV__) {
      console.log("[LOG_USER_ACTION]", line);
    }

    return fileUri;
  } catch (error) {
    if (__DEV__) {
      console.log("Error writing log:", error);
    }
  }
}

/**
 * Obtiene todos los archivos de log disponibles
 */
export async function getAllLogFiles(): Promise<{ name: string, uri: string, isExternal: boolean }[]> {
  try {
    const files: { name: string, uri: string, isExternal: boolean }[] = [];

    // Obtener archivos del directorio interno
    try {
      const internalFiles = await FileSystem.readDirectoryAsync(INTERNAL_LOG_DIR);
      internalFiles
        .filter(name => name.startsWith('isync-log-') && name.endsWith('.txt'))
        .forEach(name => {
          files.push({
            name,
            uri: INTERNAL_LOG_DIR + name,
            isExternal: false
          });
        });
    } catch (error) {
      console.log('Error leyendo directorio interno:', error);
    }

    // Obtener archivos del directorio externo (si existe)
    if (externalLogDir && Platform.OS === 'android') {
      try {
        const externalFiles = await FileSystem.StorageAccessFramework.readDirectoryAsync(externalLogDir);
        externalFiles
          .filter(uri => uri.includes('isync-log-') && uri.endsWith('.txt'))
          .forEach(uri => {
            const name = uri.split('/').pop() || 'unknown.txt';
            files.push({
              name,
              uri,
              isExternal: true
            });
          });
      } catch (error) {
        console.log('Error leyendo directorio externo:', error);
      }
    }

    return files.sort((a, b) => b.name.localeCompare(a.name)); // Más recientes primero
  } catch (error) {
    console.error('Error obteniendo archivos de log:', error);
    return [];
  }
}

/**
 * Obtiene el archivo de log actual (del día de hoy)
 */
export async function getCurrentLogFileInfo(): Promise<{ fileName: string, fileUri: string, date: string, isExternal: boolean } | null> {
  try {
    const savedFileInfo = await AsyncStorage.getItem(CURRENT_LOG_FILE_KEY);
    if (savedFileInfo) {
      const { fileName, fileUri, date } = JSON.parse(savedFileInfo);
      return {
        fileName,
        fileUri,
        date,
        isExternal: fileUri.includes('content://')
      };
    }
    return null;
  } catch (error) {
    console.log("Error getting current log file info:", error);
    return null;
  }
}

/**
 * Obtiene todos los logs guardados en AsyncStorage como array.
 */
export async function getLogsFromAsyncStorage(): Promise<UserActionLog[]> {
  try {
    const existing = await AsyncStorage.getItem(ASYNC_STORAGE_LOG_KEY);
    if (!existing) return [];
    return JSON.parse(existing);
  } catch (error) {
    if (__DEV__) {
      console.log("Error reading logs from AsyncStorage:", error);
    }
    return [];
  }
}

/**
 * Limpia todos los logs del AsyncStorage.
 */
export async function clearLogsFromAsyncStorage() {
  try {
    await AsyncStorage.removeItem(ASYNC_STORAGE_LOG_KEY);
    await AsyncStorage.removeItem(CURRENT_LOG_FILE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.log("Error clearing logs from AsyncStorage:", error);
    }
  }
}

export async function createCategorizedLogFile(fileName: string): Promise<string> {
  try {
    // Obtener los logs guardados
    const logs = await getLogsFromAsyncStorage();
    if (logs.length === 0) {
      throw new Error("No hay logs para generar archivo categorizado.");
    }

    // Agrupar por sección
    const grouped: Record<string, UserActionLog[]> = {};
    logs.forEach((log) => {
      const key = log.section ?? "SIN_SECCION";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });

    // Construir el contenido del archivo
    const sections = Object.keys(grouped).sort();
    const content = sections
      .map((section) => {
        const header = `=== SECCION: ${section} ===`;
        const lines = grouped[section]
          .map((entry) => formatLogLine(entry))
          .join("\n\n");
        return `${header}\n${lines}`;
      })
      .join("\n\n");

    // Guardar en el directorio externo
    const { fileUri } = await getCurrentLogFilePath();
    const exportFileName = fileName || `isync-export-${new Date().toISOString().split('T')[0]}.txt`;
    const exportFileUri = await saveToExternalStorage(content, exportFileName);

    return exportFileUri;
  } catch (error) {
    if (__DEV__) console.log("Error creando archivo de logs categorizado:", error);
    throw error;
  }
}

/**
 * Guarda contenido en almacenamiento externo
 */
async function saveToExternalStorage(content: string, fileName: string): Promise<string> {
  try {
    const externalDir = await getOrCreateExternalLogDir();

    if (Platform.OS === 'android' && externalDir !== INTERNAL_LOG_DIR) {
      // En Android con permisos externos
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        externalDir,
        fileName,
        'text/plain'
      );

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } else {
      // En iOS o fallback a interno
      const fileUri = `${externalDir}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return fileUri;
    }
  } catch (error) {
    console.error('Error guardando en almacenamiento externo:', error);
    // Fallback al directorio interno
    const fileUri = `${INTERNAL_LOG_DIR}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
  }
}

/**
 * Crea un archivo .txt con los logs almacenados en AsyncStorage y lo comparte usando `expo-sharing`.
 */
export async function createAndShareTxtFile(fileName: string): Promise<void> {
  try {
    // Obtener los logs guardados en AsyncStorage
    const logs = await getLogsFromAsyncStorage();
    if (logs.length === 0) {
      if (__DEV__) console.log("No hay logs para compartir.");
      return;
    }

    // Agrupar por sección para mantener la estructura
    const grouped: Record<string, UserActionLog[]> = {};
    logs.forEach((log) => {
      const key = log.section ?? "SIN_SECCION";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });

    // Construir el contenido formateado
    const sections = Object.keys(grouped).sort();
    const content = sections
      .map((section) => {
        const header = `=== SECCION: ${section} ===`;
        const lines = grouped[section]
          .map((entry) => formatLogLine(entry))
          .join("\n");
        return `${header}\n${lines}`;
      })
      .join("\n\n");

    const exportFileName = fileName || `isync-logs-${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = await saveToExternalStorage(content, exportFileName);

    // Compartir usando expo-sharing
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      if (__DEV__) console.log("Sharing is not available on this device.");
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/plain",
      dialogTitle: "Compartir archivo de logs iSync",
    });
  } catch (error) {
    if (__DEV__) console.log("Error creating or sharing txt file:", error);
    throw error;
  }
}

/**
 * Limpia archivos de log antiguos (mantiene solo los últimos N días)
 */
export async function cleanupOldLogFiles(daysToKeep: number = 7): Promise<void> {
  try {
    const files = await getAllLogFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      // Extraer fecha del nombre del archivo
      const dateMatch = file.name.match(/isync-log-(\d{4})-(\d{2})-(\d{2})\.txt/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const fileDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (fileDate < cutoffDate) {
          await FileSystem.deleteAsync(file.uri).catch(() => {
            // Ignorar errores al eliminar archivos
          });
        }
      }
    }
  } catch (error) {
    console.log("Error cleaning up old log files:", error);
  }
}

/**
 * Obtiene información sobre el almacenamiento actual de logs
 */
export async function getLogStorageInfo(): Promise<{
  internalDir: string;
  externalDir: string | null;
  currentFile: string | null;
  totalFiles: number;
}> {
  const files = await getAllLogFiles();
  const currentFileInfo = await getCurrentLogFileInfo();

  return {
    internalDir: INTERNAL_LOG_DIR,
    externalDir: externalLogDir,
    currentFile: currentFileInfo?.fileUri || null,
    totalFiles: files.length
  };
}