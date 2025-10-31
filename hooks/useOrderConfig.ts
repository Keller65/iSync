import { useAppStore } from '@/state/index';

/**
 * Hook personalizado para acceder y modificar la configuración de pedidos
 */
export const useOrderConfig = () => {
  const orderConfig = useAppStore((state) => state.orderConfig);
  const setCodigoConcepto = useAppStore((state) => state.setCodigoConcepto);
  const setAlmacenSalida = useAppStore((state) => state.setAlmacenSalida);
  const clearOrderConfig = useAppStore((state) => state.clearOrderConfig);

  return {
    orderConfig,
    setCodigoConcepto,
    setAlmacenSalida,
    clearOrderConfig,
    // Getters individuales para facilidad de uso
    codigoConcepto: orderConfig.codigoConcepto,
    almacenSalida: orderConfig.almacenSalida,
    // Validaciones
    isConfigComplete: !!(orderConfig.codigoConcepto && orderConfig.almacenSalida),
    hasCodigoConcepto: !!orderConfig.codigoConcepto,
    hasAlmacenSalida: !!orderConfig.almacenSalida,
  };
};