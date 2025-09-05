import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import uuid from "react-native-uuid";

const STORAGE_KEY = "deviceUUID";

async function getOrCreateUUID() {
  try {
    let id = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!id) {
      id = uuid.v4(); // Generar UUID usando react-native-uuid
      await SecureStore.setItemAsync(STORAGE_KEY, id);
      console.log("Nuevo UUID generado y almacenado:", id);
    } else {
      console.log("UUID existente recuperado:", id);
    }
    return id;
  } catch (error) {
    console.error("Error al acceder o generar el UUID:", error);
    throw error;
  }
}

export function useLicense() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const id = await getOrCreateUUID();
      setUuid(id);
      setValid(true);
      console.log("UUID KEY generado:", id);

      setLoading(false);
    })();
  }, []);

  return { uuid, valid, loading };
}
