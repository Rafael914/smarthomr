import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import styles from "../styles/pzemHistory";
import {
  fetchPzemHistory,
  PzemHistoryResponse,
} from "../axiosFolder/pzem";

const REFRESH_INTERVAL_MS = 60_000;

function formatKwh(value: string | number | undefined): string {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : "0.000";
}

function formatPeriod(period: string, includeTime = false): string {
  const date = new Date(period);
  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function PzemHistory() {
  const [history, setHistory] = useState<PzemHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHasError(false);
      setHistory(await fetchPzemHistory());
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

  const dailyTotal = history?.daily.reduce(
    (total, item) => total + Number(item.total_kwh),
    0
  );
  const currentMonth = history?.monthly[0];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>PZEM History</Text>
          <Text style={styles.subtitle}>
            Hourly storage with daily and monthly totals
          </Text>
        </View>

        {loading && !history ? (
          <ActivityIndicator color="#22c55e" />
        ) : hasError && !history ? (
          <Text style={[styles.message, styles.error]}>
            Unable to load saved PZEM history.
          </Text>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total used today</Text>
              <Text style={styles.summaryValue}>
                {formatKwh(dailyTotal)} kWh
              </Text>
              <Text style={styles.summaryHint}>
                Current month: {formatKwh(currentMonth?.total_kwh)} kWh
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Hourly history · last 24 hours</Text>
            {history?.hourly.length ? (
              history.hourly.map((item) => (
                <View key={item.period} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.outletName}>
                      {formatPeriod(item.period, true)}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatKwh(item.total_kwh)} kWh
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.message}>No hourly records yet.</Text>
            )}

            <Text style={styles.sectionTitle}>Monthly history · last 12 months</Text>
            {history?.monthly.length ? (
              history.monthly.map((item) => (
                <View key={item.period} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.outletName}>
                      {new Date(item.period).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                      })}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatKwh(item.total_kwh)} kWh
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.message}>No monthly records yet.</Text>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadHistory}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? "Refreshing..." : "Refresh history"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
