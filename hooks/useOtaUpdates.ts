import { useEffect, useState } from "react";
import * as Updates from "expo-updates";

export function useOtaUpdates() {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  // Checa si hay update disponible, pero no la aplica automáticamente
  const checkForUpdate = async () => {
    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();
      setIsUpdateAvailable(!!update.isAvailable);
    } catch (err) {
      if (err instanceof Error) setError(err);
    } finally {
      setIsChecking(false);
    }
  };

  // Aplica la actualización si está disponible
  const checkAndUpdate = async () => {
    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();
      setIsUpdateAvailable(!!update.isAvailable);
      if (update.isAvailable) {
        setIsUpdating(true);
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (err) {
      if (err instanceof Error) setError(err);
    } finally {
      setIsChecking(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Solo corre en release o dev-client, no en Expo Go
    if (!__DEV__) {
      checkForUpdate();
    }
  }, []);

  return { isChecking, isUpdating, error, isUpdateAvailable, checkAndUpdate };
}
