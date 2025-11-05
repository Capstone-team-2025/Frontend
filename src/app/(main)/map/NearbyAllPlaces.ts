"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { fetchNearbyAll, type NearbyAllResponse, type Place } from "@/services/places";

export type LatLng = { lat: number; lng: number };

export type UseNearbyAllState = {
  center: LatLng;
  loading: boolean;
  error?: string;
  brands: string[];
  byBrand: Record<string, Place[]>;
  flat: Place[];
  reload: (opts?: { center?: LatLng }) => void;
};

const DEFAULT_CENTER: LatLng = { lat: 36.84, lng: 127.18 };

function isValidLatLng(lat?: number, lng?: number) {
  if (lat == null || lng == null) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function flatten(res: NearbyAllResponse | undefined): Place[] {
  if (!res?.data) return [];
  const out: Place[] = [];
  for (const brand of Object.keys(res.data)) {
    const arr = res.data[brand] ?? [];
    for (const p of arr) out.push(p);
  }
  return out;
}

export function useNearbyAll(initialCenter?: LatLng): UseNearbyAllState {
  const [center, setCenter] = useState<LatLng>(initialCenter ?? DEFAULT_CENTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [byBrand, setByBrand] = useState<Record<string, Place[]>>({});
  const abortRef = useRef<AbortController | null>(null);

  const getGeolocation = useCallback(async (): Promise<LatLng> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(center);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(center),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 10_000 }
      );
    });
  }, [center]);

  const fetchAll = useCallback(async (c: LatLng) => {
    setLoading(true);
    setError(undefined);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const json = await fetchNearbyAll(c.lat, c.lng, { signal: ac.signal });
      if (!json.success) throw new Error(json.message ?? "Unknown error");
      setByBrand(json.data ?? {});
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e &&
        "name" in e &&
        typeof (e as { name?: unknown }).name === "string" &&
        (e as { name?: unknown }).name === "AbortError"
      ) {
      } else {
        const msg =
          e instanceof Error
            ? e.message
            : (typeof e === "object" &&
               e &&
               "message" in e &&
               typeof (e as { message?: unknown }).message === "string")
            ? ((e as { message?: unknown }).message as string)
            : String(e);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const geo = await getGeolocation();
      const next = isValidLatLng(geo.lat, geo.lng) ? geo : DEFAULT_CENTER;
      setCenter(next);
      fetchAll(next);
    })();
    return () => abortRef.current?.abort();
  }, [getGeolocation, fetchAll]);

  const reload = useCallback((opts?: { center?: LatLng }) => {
    const next = opts?.center ?? center;
    if (opts?.center) setCenter(next);
    fetchAll(next);
  }, [center, fetchAll]);

  const brands = useMemo(() => Object.keys(byBrand).sort(), [byBrand]);

  const flat = useMemo(() => {
    return flatten({ success: true, message: "", totalBrands: 0, totalPlaces: 0, data: byBrand });
  }, [byBrand]);

  return { center, loading, error, brands, byBrand, flat, reload };
}
