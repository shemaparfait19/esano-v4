"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import rwandaLocations from "@/data/rwanda-locations.json";

interface LocationSelectorProps {
  value?: {
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  onChange: (location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  }) => void;
  disabled?: boolean;
}

export function LocationSelector({ value, onChange, disabled }: LocationSelectorProps) {
  const [province, setProvince] = useState(value?.province || "");
  const [district, setDistrict] = useState(value?.district || "");
  const [sector, setSector] = useState(value?.sector || "");
  const [cell, setCell] = useState(value?.cell || "");
  const [village, setVillage] = useState(value?.village || "");

  // Update state when value prop changes (for editing existing members)
  useEffect(() => {
    if (value && typeof value === 'object') {
      setProvince(value.province || "");
      setDistrict(value.district || "");
      setSector(value.sector || "");
      setCell(value.cell || "");
      setVillage(value.village || "");
    } else {
      // Reset if no value
      setProvince("");
      setDistrict("");
      setSector("");
      setCell("");
      setVillage("");
    }
  }, [value?.province, value?.district, value?.sector, value?.cell, value?.village]);

  // Get provinces
  const provinces = useMemo(() => Object.keys(rwandaLocations), []);

  // Get districts based on selected province
  const districts = useMemo(() => {
    if (!province) return [];
    return Object.keys((rwandaLocations as any)[province] || {});
  }, [province]);

  // Get sectors based on selected district
  const sectors = useMemo(() => {
    if (!province || !district) return [];
    return Object.keys((rwandaLocations as any)[province]?.[district] || {});
  }, [province, district]);

  // Get cells based on selected sector
  const cells = useMemo(() => {
    if (!province || !district || !sector) return [];
    return Object.keys((rwandaLocations as any)[province]?.[district]?.[sector] || {});
  }, [province, district, sector]);

  // Get villages based on selected cell
  const villages = useMemo(() => {
    if (!province || !district || !sector || !cell) return [];
    const data = (rwandaLocations as any)[province]?.[district]?.[sector]?.[cell] || [];
    // Ensure all values are strings
    return Array.isArray(data) ? data.filter(v => typeof v === 'string') : [];
  }, [province, district, sector, cell]);

  // Reset dependent selections when parent changes (only when manually changed, not from prop updates)
  const [manualChange, setManualChange] = useState(false);

  useEffect(() => {
    if (manualChange && province && province !== value?.province) {
      setDistrict("");
      setSector("");
      setCell("");
      setVillage("");
    }
    setManualChange(false);
  }, [province]);

  useEffect(() => {
    if (manualChange && district && district !== value?.district) {
      setSector("");
      setCell("");
      setVillage("");
    }
    setManualChange(false);
  }, [district]);

  useEffect(() => {
    if (manualChange && sector && sector !== value?.sector) {
      setCell("");
      setVillage("");
    }
    setManualChange(false);
  }, [sector]);

  useEffect(() => {
    if (manualChange && cell && cell !== value?.cell) {
      setVillage("");
    }
    setManualChange(false);
  }, [cell]);

  // Notify parent of selection (complete or partial)
  useEffect(() => {
    if (province && district && sector && cell && village) {
      console.log('✅ Complete location selected:', { province, district, sector, cell, village });
      onChange({ province, district, sector, cell, village });
    } else if (province || district || sector || cell || village) {
      // Partial selection - still notify parent
      console.log('⚠️ Partial location selected:', { province, district, sector, cell, village });
      onChange({ province, district, sector, cell, village });
    }
  }, [province, district, sector, cell, village]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Province */}
        <div className="space-y-2">
          <Label className="text-sm">Province</Label>
          <Select
            value={province}
            onValueChange={(v) => {
              setManualChange(true);
              setProvince(v);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.filter(p => typeof p === 'string').map((p) => (
                <SelectItem key={p} value={p}>
                  {String(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District */}
        <div className="space-y-2">
          <Label className="text-sm">District</Label>
          <Select
            value={district}
            onValueChange={(v) => {
              setManualChange(true);
              setDistrict(v);
            }}
            disabled={disabled || !province}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {districts.filter(d => typeof d === 'string').map((d) => (
                <SelectItem key={d} value={d}>
                  {String(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label className="text-sm">Sector</Label>
          <Select
            value={sector}
            onValueChange={(v) => {
              setManualChange(true);
              setSector(v);
            }}
            disabled={disabled || !district}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.filter(s => typeof s === 'string').map((s) => (
                <SelectItem key={s} value={s}>
                  {String(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cell */}
        <div className="space-y-2">
          <Label className="text-sm">Cell</Label>
          <Select
            value={cell}
            onValueChange={(v) => {
              setManualChange(true);
              setCell(v);
            }}
            disabled={disabled || !sector}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cell" />
            </SelectTrigger>
            <SelectContent>
              {cells.filter(c => typeof c === 'string').map((c) => (
                <SelectItem key={c} value={c}>
                  {String(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Village */}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Village</Label>
          <Select
            value={village}
            onValueChange={setVillage}
            disabled={disabled || !cell}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select village" />
            </SelectTrigger>
            <SelectContent>
              {villages.filter(v => typeof v === 'string').map((v: string) => (
                <SelectItem key={v} value={v}>
                  {String(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {province && district && sector && cell && village && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
          <strong>Location:</strong> {village}, {cell}, {sector}, {district}, {province}
        </div>
      )}
    </div>
  );
}
