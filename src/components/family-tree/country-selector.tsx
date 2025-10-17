"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countries, type Country } from "@/data/countries";

interface CountrySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: "country" | "phone";
  className?: string;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = "Select country...",
  mode = "country",
  className,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    
    if (mode === "phone") {
      // For phone mode, value might be dial code
      return countries.find((c) => c.dial_code === value || c.code === value);
    }
    
    // For country mode, value might be country name or code
    return countries.find(
      (c) => c.name.toLowerCase() === value.toLowerCase() || c.code === value
    );
  }, [value, mode]);

  const displayValue = useMemo(() => {
    if (!selectedCountry) return placeholder;
    
    if (mode === "phone") {
      return `${selectedCountry.dial_code} ${selectedCountry.name}`;
    }
    
    return selectedCountry.name;
  }, [selectedCountry, mode, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between w-full", className)}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search country..." className="h-9" />
          </div>
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {countries.map((country) => (
              <CommandItem
                key={country.code}
                value={`${country.name} ${country.code} ${country.dial_code}`}
                onSelect={() => {
                  const newValue =
                    mode === "phone"
                      ? country.dial_code
                      : country.name;
                  onChange(newValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCountry?.code === country.code
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {mode === "phone" ? (
                  <span>
                    <span className="font-medium">{country.dial_code}</span>{" "}
                    <span className="text-muted-foreground">{country.name}</span>
                  </span>
                ) : (
                  <span>{country.name}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
