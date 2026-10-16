import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styles from "../styles/pzemHistory";
import { fetchPzemHistory, PzemHistoryResponse } from "../axiosFolder/pzem";
import { fetchEnergyBudget } from "../axiosFolder/energyBudget";
import CostAnalyticsCharts from "./CostAnalyticsCharts";

const REFRESH_INTERVAL_MS = 60_000;
type Period = "hourly" | "daily" | "monthly";
const RELAYS = [
  { id: 1, name: "Living Area" },
  { id: 2, name: "Kitchen / Dining" },
  { id: 3, name: "Master Bedroom" },
  { id: 4, name: "Media Room" },
  { id: 5, name: "Front Balcony" },
];

function formatKwh(value: string | number | undefined): string {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : "0.000";
}

function formatPeso(value: number): string {
  return `PHP ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPeriod(period: string, includeTime = false): string {
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return "Unknown period";
  return includeTime
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatRecordLabel(period: string, selectedPeriod: Period): string {
  if (selectedPeriod === "monthly") {
    return new Date(period).toLocaleDateString(undefined, { year: "numeric", month: "short" });
  }
  return selectedPeriod === "daily" ? formatPeriod(period) : formatPeriod(period, true);
}

export default function PzemHistory() {
  const [history, setHistory] = useState<PzemHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [period, setPeriod] = useState<Period>("hourly");
  const [ratePerKwh, setRatePerKwh] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      setHasError(false);
      const [historyResult, budgetResult] = await Promise.allSettled([
        fetchPzemHistory(),
        fetchEnergyBudget(),
      ]);
      if (historyResult.status === "rejected") throw historyResult.reason;
      setHistory(historyResult.value);
      if (budgetResult.status === "fulfilled") {
        setRatePerKwh(Number(budgetResult.value.ratePerKwh) || 0);
      }
    } catch (error) {
      console.error("PZEM history fetch error:", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadHistory]);

  const monthlyTotal = history?.monthly.reduce((total, item) => total + (Number(item.total_kwh) || 0), 0) || 0;
  const currentMonth = Number(history?.monthly[0]?.total_kwh) || 0;
  const previousMonth = Number(history?.monthly[1]?.total_kwh) || 0;
  const todayUsage = Number(history?.daily[0]?.total_kwh) || 0;
  const monthChange = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : null;
  const records = history?.[period] || [];
  const costRecords = records.map((item) => ({
    ...item,
    usage: Number(item.total_kwh) || 0,
    estimatedCost: (Number(item.total_kwh) || 0) * ratePerKwh,
    label: formatRecordLabel(item.period, period),
  }));
  const totalPeriodCost = costRecords.reduce((total, item) => total + item.estimatedCost, 0);
  const averagePeriodCost = costRecords.length ? totalPeriodCost / costRecords.length : 0;
  const averagePeriodUsage = costRecords.length
    ? costRecords.reduce((total, item) => total + item.usage, 0) / costRecords.length
    : 0;
  const peakRecord = costRecords.reduce<(typeof costRecords)[number] | null>(
    (peak, item) => !peak || (ratePerKwh > 0 ? item.estimatedCost > peak.estimatedCost : item.usage > peak.usage) ? item : peak,
    null,
  );
  const maxCost = Math.max(...costRecords.map((item) => item.estimatedCost), 0.001);
  const periodLabels: Record<Period, string> = { hourly: "24 Hours", daily: "Today", monthly: "12 Months" };
  const averageUnit: Record<Period, string> = { hourly: "per recorded hour", daily: "per day", monthly: "per month" };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ENERGY INSIGHTS</Text>
          <Text style={styles.title}>Electricity analytics</Text>
          <Text style={styles.subtitle}>Estimated spending trends from your energy history</Text>
        </View>
        <TouchableOpacity style={styles.headerRefresh} onPress={loadHistory} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.headerRefreshText}>{loading ? "..." : "↻"}</Text>
        </TouchableOpacity>
      </View>

      {loading && !history ? (
        <View style={styles.centerState}><ActivityIndicator color="#34d399" /><Text style={styles.stateText}>Loading your energy history...</Text></View>
      ) : hasError && !history ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>!</Text><Text style={styles.emptyTitle}>Couldn&apos;t load history</Text>
          <Text style={styles.message}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}><Text style={styles.retryButtonText}>Try again</Text></TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, styles.kpiPrimary]}>
              <Ionicons name="cash-outline" style={styles.kpiIcon} /><Text style={styles.kpiLabel}>EST. COST TODAY</Text>
              <Text style={styles.kpiValue}>{ratePerKwh > 0 ? formatPeso(todayUsage * ratePerKwh) : "Set rate"}</Text>
              <Text style={styles.kpiUnit}>{formatKwh(todayUsage)} kWh used</Text>
            </View>
            <View style={styles.kpiCard}>
              <Ionicons name="calendar-outline" style={styles.kpiIcon} /><Text style={styles.kpiLabel}>EST. COST THIS MONTH</Text>
              <Text style={styles.kpiValue}>{ratePerKwh > 0 ? formatPeso(currentMonth * ratePerKwh) : "Set rate"}</Text>
              <Text style={styles.kpiUnit}>{formatKwh(currentMonth)} kWh used</Text>
            </View>
          </View>

          <View style={styles.monthSummary}>
            <View>
              <Text style={styles.monthSummaryLabel}>12-month estimated cost</Text>
              <Text style={styles.monthSummaryValue}>{ratePerKwh > 0 ? formatPeso(monthlyTotal * ratePerKwh) : "Set rate to estimate"}</Text>
              <Text style={styles.monthSummaryLabel}>{formatKwh(monthlyTotal)} kWh recorded</Text>
              {monthChange !== null ? <Text style={styles.monthSummaryTrend}>{ratePerKwh > 0 ? "Cost" : "Usage"} {monthChange === 0 ? "unchanged" : `${monthChange > 0 ? "up" : "down"} ${Math.abs(monthChange).toFixed(1)}%`} vs previous month</Text> : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.monthSummaryLabel}>Electricity rate</Text>
              <Text style={styles.monthSummaryTrend}>{ratePerKwh > 0 ? `${formatPeso(ratePerKwh)} / kWh` : "Set rate on Dashboard"}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionTitle}>Cost history</Text><Text style={styles.sectionSubtitle}>Estimated at your saved rate</Text></View>
            <Text style={styles.recordCount}>{records.length} records</Text>
          </View>
          <View style={styles.periodSelector}>
            {(Object.keys(periodLabels) as Period[]).map((key) => (
              <TouchableOpacity key={key} style={[styles.periodButton, period === key && styles.periodButtonActive]} onPress={() => setPeriod(key)} activeOpacity={0.8}>
                <Text style={[styles.periodText, period === key && styles.periodTextActive]}>{periodLabels[key]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {costRecords.length > 0 ? (
            <View style={styles.insightGrid}>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>{ratePerKwh > 0 ? "AVERAGE COST" : "AVERAGE USE"}</Text>
                <Text style={styles.insightValue}>{ratePerKwh > 0 ? formatPeso(averagePeriodCost) : `${formatKwh(averagePeriodUsage)} kWh`}</Text>
                <Text style={styles.insightHint}>{ratePerKwh > 0 ? averageUnit[period] : "per recorded interval"}</Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>{ratePerKwh > 0 ? "HIGHEST COST" : "HIGHEST USE"}</Text>
                <Text style={styles.insightValue}>{ratePerKwh > 0 ? formatPeso(peakRecord?.estimatedCost || 0) : `${formatKwh(peakRecord?.usage)} kWh`}</Text>
                <Text style={styles.insightHint}>{peakRecord?.label || "No period"}</Text>
              </View>
            </View>
          ) : null}

          <CostAnalyticsCharts
            records={costRecords}
            ratePerKwh={ratePerKwh}
            formatValue={(value) => ratePerKwh > 0 ? formatPeso(value) : `${formatKwh(value)} kWh`}
          />

          <View style={styles.relayBreakdown}>
            <Text style={styles.sectionTitle}>Usage by relay</Text>
            <Text style={styles.sectionSubtitle}>Energy use and estimated cost for {periodLabels[period].toLowerCase()}.</Text>
            {RELAYS.map((relay) => {
              const usage = Number(history?.relayTotals?.[period]?.find((item) => Number(item.outlet_id) === relay.id)?.total_kwh) || 0;
              return <View key={relay.id} style={styles.relayRow}>
                <View style={styles.relayLabelGroup}>
                  <Text style={styles.relayNumber}>Relay {relay.id}</Text>
                  <Text style={styles.relayLocation}>{relay.name}</Text>
                </View>
                <View style={styles.relayValueGroup}>
                  <Text style={styles.relayCost}>{ratePerKwh > 0 ? formatPeso(usage * ratePerKwh) : "Set rate"}</Text>
                  <Text style={styles.relayUsage}>{formatKwh(usage)} kWh</Text>
                </View>
              </View>;
            })}
          </View>

          {records.length ? (
            <View style={styles.historyList}>
              {costRecords.map((item) => {
                const barWidth = `${Math.max((item.estimatedCost / maxCost) * 100, 3)}%` as `${number}%`;
                return (
                  <View key={item.period} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View style={styles.dateGroup}><View style={styles.dateDot} /><Text style={styles.outletName}>{item.label}</Text></View>
                      <View style={{ alignItems: "flex-end" }}><Text style={styles.timestamp}>{ratePerKwh > 0 ? formatPeso(item.estimatedCost) : "Set rate"}</Text><Text style={styles.monthSummaryLabel}>{formatKwh(item.usage)} kWh</Text></View>
                    </View>
                    <View style={styles.barTrack}><View style={[styles.barFill, { width: barWidth }]} /></View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}><Text style={styles.emptyIcon}>◌</Text><Text style={styles.emptyTitle}>No records yet</Text><Text style={styles.message}>Usage data will appear here after the next reading.</Text></View>
          )}
          {ratePerKwh === 0 ? <Text style={styles.lastUpdated}>Add your electricity rate on the Dashboard to calculate cost estimates.</Text> : null}
        </>
      )}
      {history && !loading ? <Text style={styles.lastUpdated}>Updates automatically every minute</Text> : null}
    </ScrollView>
  );
}
