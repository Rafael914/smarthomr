import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styles from "../styles/pzemHistory";
import { fetchPzemHistory, PzemHistoryResponse } from "../axiosFolder/pzem";
import { fetchEnergyBudget } from "../axiosFolder/energyBudget";
import CostAnalyticsCharts from "./CostAnalyticsCharts";

const REFRESH_INTERVAL_MS = 60_000;
const HISTORY_PAGE_SIZE = 10;
type Period = "hourly" | "daily" | "monthly";
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

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function PzemHistory() {
  const [history, setHistory] = useState<PzemHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [period, setPeriod] = useState<Period>("hourly");
  const [historyPage, setHistoryPage] = useState(1);
  const [ratePerKwh, setRatePerKwh] = useState(0);
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [selectedDayUsage, setSelectedDayUsage] = useState(0);
  const [selectedDayLoading, setSelectedDayLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHasError(false);
      const [historyResult, budgetResult] = await Promise.allSettled([
        fetchPzemHistory(selectedDate, { year: calendarMonth.getFullYear(), month: calendarMonth.getMonth() + 1 }),
        fetchEnergyBudget(),
      ]);
      if (historyResult.status === "rejected") throw historyResult.reason;
      setHistory(historyResult.value);
      setSelectedDayUsage(Number(historyResult.value.selectedDay?.total_kwh) || 0);
      if (budgetResult.status === "fulfilled") {
        setRatePerKwh(Number(budgetResult.value.ratePerKwh) || 0);
      }
    } catch (error) {
      console.error("PZEM history fetch error:", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [calendarMonth, selectedDate]);

  const loadSelectedDay = useCallback(async (date: string, year = calendarMonth.getFullYear(), month = calendarMonth.getMonth() + 1) => {
    setSelectedDayLoading(true);
    try {
      const result = await fetchPzemHistory(date, { year, month });
      setSelectedDayUsage(Number(result.selectedDay?.total_kwh) || 0);
      setHistory((current) => current ? { ...current, ...result } : result);
    } catch (error) {
      console.error("Selected day history error:", error);
    } finally {
      setSelectedDayLoading(false);
    }
  }, [calendarMonth]);

  const selectDate = (date: Date) => {
    const key = dateKey(date);
    setSelectedDate(key);
    setPeriod("hourly");
    loadSelectedDay(key);
  };

  const goToMonth = (year: number, month: number) => {
    const firstOfMonth = new Date(year, month, 1);
    setCalendarMonth(firstOfMonth);
    setPeriod("daily");
    const key = dateKey(firstOfMonth);
    setSelectedDate(key);
    loadSelectedDay(key, year, month + 1);
  };

  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstDay + 1),
  );
  const isFutureDate = selectedDate > dateKey(today);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadHistory]);

  const monthlyTotal = Number(history?.calendarYearTotal) || 0;
  const currentMonth = Number(history?.calendarMonthTotal) || 0;
  const selectedDayTotal = Number(history?.selectedDay?.total_kwh ?? selectedDayUsage) || 0;
  const records = period === "hourly"
    ? history?.calendarHourly || []
    : period === "daily"
      ? history?.calendarDaily || []
      : history?.calendarMonthly || [];
  const costRecords = records.map((item) => ({
    ...item,
    usage: Number(item.total_kwh) || 0,
    estimatedCost: (Number(item.total_kwh) || 0) * ratePerKwh,
    label: formatRecordLabel(item.period, period),
  }));
  const totalPeriodCost = costRecords.reduce((total, item) => total + item.estimatedCost, 0);
  const totalPeriodUsage = costRecords.reduce((total, item) => total + item.usage, 0);
  const averagePeriodCost = costRecords.length ? totalPeriodCost / costRecords.length : 0;
  const averagePeriodUsage = costRecords.length
    ? costRecords.reduce((total, item) => total + item.usage, 0) / costRecords.length
    : 0;
  const peakRecord = costRecords.reduce<(typeof costRecords)[number] | null>(
    (peak, item) => !peak || (ratePerKwh > 0 ? item.estimatedCost > peak.estimatedCost : item.usage > peak.usage) ? item : peak,
    null,
  );
  const maxCost = Math.max(...costRecords.map((item) => item.estimatedCost), 0.001);
  const pageCount = Math.max(1, Math.ceil(costRecords.length / HISTORY_PAGE_SIZE));
  const visibleCostRecords = costRecords.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);
  const periodLabels: Record<Period, string> = {
    hourly: "Selected Day",
    daily: calendarMonth.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
    monthly: String(calendarMonth.getFullYear()),
  };
  const averageUnit: Record<Period, string> = { hourly: "per recorded hour", daily: "per day", monthly: "per month" };

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedDate, calendarMonth, period]);

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
              <Ionicons name="cash-outline" style={styles.kpiIcon} /><Text style={styles.kpiLabel}>EST. COST — {selectedDate}</Text>
              <Text style={styles.kpiValue}>{ratePerKwh > 0 ? formatPeso(selectedDayTotal * ratePerKwh) : "Set rate"}</Text>
              <Text style={styles.kpiUnit}>{formatKwh(selectedDayTotal)} kWh used</Text>
            </View>
            <View style={styles.kpiCard}>
              <Ionicons name="calendar-outline" style={styles.kpiIcon} /><Text style={styles.kpiLabel}>EST. COST — {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase()}</Text>
              <Text style={styles.kpiValue}>{ratePerKwh > 0 ? formatPeso(currentMonth * ratePerKwh) : "Set rate"}</Text>
              <Text style={styles.kpiUnit}>{formatKwh(currentMonth)} kWh used</Text>
            </View>
          </View>

          <View style={styles.monthSummary}>
            <View>
              <Text style={styles.monthSummaryLabel}>ESTIMATED COST — {calendarMonth.getFullYear()}</Text>
              <Text style={styles.monthSummaryValue}>{ratePerKwh > 0 ? formatPeso(monthlyTotal * ratePerKwh) : "Set rate to estimate"}</Text>
              <Text style={styles.monthSummaryLabel}>{formatKwh(monthlyTotal)} kWh recorded</Text>
              <Text style={styles.monthSummaryTrend}>{formatKwh(currentMonth)} kWh in {calendarMonth.toLocaleDateString(undefined, { month: "long" })}</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.monthSummaryLabel}>Electricity rate</Text>
              <Text style={styles.monthSummaryTrend}>{ratePerKwh > 0 ? `${formatPeso(ratePerKwh)} / kWh` : "Set rate on Dashboard"}</Text>
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarSectionTitle}>Daily consumption</Text>
              <Text style={styles.calendarHint}>Choose a year, month, then day</Text>
            </View>
            <View style={styles.yearSelector}>
              {Array.from({ length: 7 }, (_, index) => calendarMonth.getFullYear() - 3 + index).map((year) => (
                <TouchableOpacity
                  key={year}
                  onPress={() => goToMonth(year, calendarMonth.getMonth())}
                  style={[styles.yearButton, calendarMonth.getFullYear() === year && styles.yearButtonActive]}
                >
                  <Text style={[styles.yearText, calendarMonth.getFullYear() === year && styles.yearTextActive]}>{year}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.monthSelector}>
              {Array.from({ length: 12 }, (_, month) => (
                <TouchableOpacity
                  key={month}
                  onPress={() => goToMonth(calendarMonth.getFullYear(), month)}
                  style={[styles.monthButton, calendarMonth.getMonth() === month && styles.monthButtonActive]}
                >
                  <Text style={[styles.monthText, calendarMonth.getMonth() === month && styles.monthTextActive]}>
                    {new Date(2000, month, 1).toLocaleDateString(undefined, { month: "short" })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => goToMonth(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)}>
                <Text style={styles.calendarArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
              <TouchableOpacity onPress={() => goToMonth(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)}>
                <Text style={styles.calendarArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeek}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Text key={day} style={styles.calendarWeekday}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((date, index) => date ? (
                <TouchableOpacity key={dateKey(date)} onPress={() => selectDate(date)} style={[styles.calendarDay, selectedDate === dateKey(date) && styles.calendarDaySelected]}>
                  <Text style={[styles.calendarDayText, selectedDate === dateKey(date) && styles.calendarDayTextSelected]}>{date.getDate()}</Text>
                </TouchableOpacity>
              ) : <View key={`empty-${index}`} style={styles.calendarDay} />)}
            </View>
            <View style={styles.selectedDaySummary}>
              <Text style={styles.selectedDayLabel}>WHOLE-HOUSE CONSUMPTION — {selectedDate}</Text>
              <Text style={styles.selectedDayValue}>
                {selectedDayLoading ? "Loading..." : isFutureDate ? "No recorded data yet" : `${formatKwh(selectedDayUsage)} kWh`}
              </Text>
              <Text style={styles.selectedDayCost}>
                {isFutureDate ? "This date is in the future" : ratePerKwh > 0 ? formatPeso(selectedDayUsage * ratePerKwh) : "Set your rate to estimate cost"}
              </Text>
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

          {records.length ? (
            <View style={styles.historyList}>
              {visibleCostRecords.map((item) => {
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
              {costRecords.length > HISTORY_PAGE_SIZE ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.paginationButton, historyPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => setHistoryPage((page) => Math.max(1, page - 1))}
                    disabled={historyPage === 1}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.paginationButtonText}>Previous</Text>
                  </TouchableOpacity>
                  <Text style={styles.paginationLabel}>Page {historyPage} of {pageCount}</Text>
                  <TouchableOpacity
                    style={[styles.paginationButton, historyPage === pageCount && styles.paginationButtonDisabled]}
                    onPress={() => setHistoryPage((page) => Math.min(pageCount, page + 1))}
                    disabled={historyPage === pageCount}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={styles.historyTotal}>
                <View>
                  <Text style={styles.historyTotalLabel}>TOTAL FOR {period === "daily" ? calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase() : periodLabels[period].toUpperCase()}</Text>
                  <Text style={styles.historyTotalUsage}>{formatKwh(totalPeriodUsage)} kWh</Text>
                </View>
                <Text style={styles.historyTotalCost}>{ratePerKwh > 0 ? formatPeso(totalPeriodCost) : "Set rate"}</Text>
              </View>
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
