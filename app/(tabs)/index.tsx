import { useLicense } from "@/auth/useLicense";
import BottomSheetCart from '@/components/BottomSheetCart/page';
import BottomSheetWelcome from '@/components/BottomSheetWelcome/page';
import GoalDonut from '@/components/Dashboard/GoalDonut';
import KPICard from '@/components/Dashboard/KPICard';
import UpdateBanner from '@/components/UpdateBanner';
import { useAuth } from '@/context/auth';
import { useOtaUpdates } from "@/hooks/useOtaUpdates";
import { useAppStore } from '@/state';
import { GoalDonutType, SalesDataType, TableDataType } from "@/types/DasboardType";
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import "../../global.css";

export default function App() {
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [goalData, setGoalData] = useState<GoalDonutType | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [sales, setSales] = useState<SalesDataType | null>(null);
  const { valid, loading, uuid } = useLicense();
  const { isUpdating, error, isUpdateAvailable, checkAndUpdate } = useOtaUpdates();
  const [kpiData, setKpiData] = useState(null);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [tableData, setTableData] = useState<TableDataType | null>(null);
  const [loadingTableData, setLoadingTableData] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);

  const fetchData = async () => {
    if (!user?.token) return;
    const slpCode = user.salesPersonCode;

    try {
      setLoadingKpi(true);
      setLoadingSales(true);
      const [goalRes, kpiRes, salesRes] = await Promise.all([
        axios.get(`${fetchUrl}/api/Metrics/sales-progress/${slpCode}?mode=net`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
            'Content-Encoding': 'gzip'
          }
        }),
        fetch(`${fetchUrl}/api/Kpi/sales-vs-collections/${slpCode}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          }
        }).then(res => res.json()),
        fetch(`${fetchUrl}/api/Kpi/monthly/${slpCode}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          }
        }).then(res => res.json())
      ]);

      const goalData = goalRes.data;
      setGoalData({
        current: goalData.actual ?? 0,
        target: goalData.target ?? 0,
        progressPct: goalData.progressPct,
        currency: goalData.currency,
        centerLabelPrimary: goalData.centerLabel?.primary,
        centerLabelSecondary: goalData.centerLabel?.secondary,
        lastUpdated: goalData.lastUpdated
      });

      setKpiData(kpiRes);
      setSales(salesRes);
    } catch (e) {
      console.error('Error fetching data:', e);
      setGoalError('No se pudieron cargar los datos');
    } finally {
      setLoadingKpi(false);
      setLoadingSales(false);
    }
  };

  const fetchTableData = async () => {
    if (!user?.token) return;
    const slpCode = user.salesPersonCode;

    try {
      setLoadingTableData(true);
      const response = await fetch(`${fetchUrl}/api/Kpi/aging-36-60/${slpCode}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener los datos de la tabla");
      }

      const data: TableDataType = await response.json();
      setTableData(data);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTableError("No se pudieron cargar los datos de la tabla");
    } finally {
      setLoadingTableData(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTableData();
  }, [user?.token]);

  const goal = { current: goalData?.current || 0, target: goalData?.target || 0 };
  const products = useAppStore((s) => s.products);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => {
      setRefreshKey((k) => k + 1);
      setRefreshing(false);
    });
  }, []);

  if (isUpdating) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", gap: 10 }}>
        <ActivityIndicator size="large" color="#000" />
        <Text className='font-[Poppins-SemiBold] tracking-[-0.3px]'>Actualizando...</Text>
      </View>
    );
  }

  if (error) {
    console.warn("Error al buscar OTA:", error);
  }

  const ventas = [
    { fecha: "2024-06-01", cliente: "Cliente A", monto: 12000 },
    { fecha: "2024-06-02", cliente: "Cliente B", monto: 8500 },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center gap-2">
        <ActivityIndicator size="large" color="#000" />
        <Text className='font-[Poppins-SemiBold] tracking-[-0.3px]'>Validando Licencia...</Text>
      </View>
    );
  }

  if (!valid) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-500 font-[Poppins-SemiBold] tracking-[-0.3px]">
          Licencia Expirada
        </Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-white relative'>
      <View className="absolute bottom-4 right-8 gap-3 items-end">
        {products.length > 0 && (<BottomSheetCart />)}
      </View>

      <FlatList
        data={ventas}
        keyExtractor={(item, idx) => item.fecha + item.cliente + idx}
        ListHeaderComponent={
          <>
            <UpdateBanner
              visible={isUpdateAvailable}
              onReload={checkAndUpdate}
              message="Actualización disponible"
            />

            <View className='px-4 gap-6'>
              <View>
                <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">Ventas vs Cobros</Text>
                <KPICard data={kpiData} userName={user?.fullName} loading={loadingKpi} />
              </View>

              <View>
                <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">Ventas</Text>
                <GoalDonut
                  current={goal.current}
                  target={goal.target}
                  progressPct={goalData?.progressPct}
                  currency={goalData?.currency}
                  centerLabelPrimary={goalData?.centerLabelPrimary}
                  centerLabelSecondary={goalData?.centerLabelSecondary}
                  lastUpdated={goalData?.lastUpdated}
                  loading={loadingGoal}
                />
              </View>
            </View>

            <View className="px-4 mt-4">
              <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.6px] text-black">
                Facturas Pendientes
              </Text>

              <Text className="text-sm font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-500 mb-3">
                {tableData?.title}
              </Text>

              <View className="flex-row bg-white py-3 w-full justify-between flex-1 rounded-full">
                <Text className="text-black font-[Poppins-SemiBold] text-sm">Código</Text>
                <Text className="text-black font-[Poppins-SemiBold] text-sm">Cliente</Text>
                <Text className="text-black font-[Poppins-SemiBold] text-sm">Días</Text>
                <Text className="text-black font-[Poppins-SemiBold] text-sm">Pendiente</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ index }) => (
          <View>
            <View className="flex-row py-3 px-5 w-full justify-between items-center border-b border-gray-100">
              <Text className="text-gray-900 tracking-[-0.3px] font-[Poppins-Regular] text-sm" style={{ flex: 1 }}>
                {tableData?.items?.[index]?.cardCode ?? "-"}
              </Text>
              <Text className="text-gray-900 tracking-[-0.3px] font-[Poppins-Regular] text-sm" style={{ flex: 2 }}>
                {tableData?.items?.[index]?.cardName ?? "-"}
              </Text>
              <Text className="text-gray-900 tracking-[-0.3px] font-[Poppins-Regular] text-sm" style={{ flex: 1 }}>
                {tableData?.items?.[index]?.days ?? "-"}
              </Text>
              <Text className="text-gray-900 tracking-[-0.3px] font-[Poppins-Regular] text-sm text-right" style={{ flex: 1 }}>
                L. {typeof tableData?.items?.[index]?.pending === "number"
                  ? tableData.items[index].pending.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : "-"}
              </Text>
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: products.length > 0 ? 24 : 0 }}
      />

      <BottomSheetWelcome />
    </View>
  );
}