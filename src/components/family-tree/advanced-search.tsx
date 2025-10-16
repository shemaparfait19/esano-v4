"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FamilyMember } from "@/types/family-tree";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X, MapPin, Calendar, Tag, User } from "lucide-react";

interface AdvancedSearchProps {
  members: FamilyMember[];
  onSelectMember: (memberId: string) => void;
}

export function AdvancedSearch({ members, onSelectMember }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [searchBirthYear, setSearchBirthYear] = useState("");
  const [searchGender, setSearchGender] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!debouncedQuery && !searchLocation && !searchTag && !searchBirthYear && !searchGender) {
      return [];
    }

    return members.filter((member) => {
      // Text search (name, notes, email)
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        const nameMatch = member.fullName?.toLowerCase().includes(query) ||
                         member.firstName?.toLowerCase().includes(query) ||
                         member.lastName?.toLowerCase().includes(query);
        const notesMatch = member.notes?.toLowerCase().includes(query);
        const emailMatch = member.contacts?.email?.toLowerCase().includes(query);
        
        if (!nameMatch && !notesMatch && !emailMatch) return false;
      }

      // Location search
      if (searchLocation) {
        const locQuery = searchLocation.toLowerCase();
        if (typeof member.location === 'string') {
          if (!member.location.toLowerCase().includes(locQuery)) return false;
        } else if (typeof member.location === 'object' && member.location) {
          const locStr = `${member.location.village} ${member.location.cell} ${member.location.sector} ${member.location.district} ${member.location.province}`.toLowerCase();
          if (!locStr.includes(locQuery)) return false;
        } else {
          return false;
        }
      }

      // Tag search
      if (searchTag) {
        const tagQuery = searchTag.toLowerCase();
        const hasTags = member.tags?.some(t => t.toLowerCase().includes(tagQuery));
        if (!hasTags) return false;
      }

      // Birth year search
      if (searchBirthYear) {
        const birthYear = member.birthDate?.substring(0, 4);
        if (birthYear !== searchBirthYear) return false;
      }

      // Gender search
      if (searchGender) {
        if (member.gender !== searchGender) return false;
      }

      return true;
    });
  }, [members, debouncedQuery, searchLocation, searchTag, searchBirthYear, searchGender]);

  const handleClearAll = () => {
    setSearchQuery("");
    setSearchLocation("");
    setSearchTag("");
    setSearchBirthYear("");
    setSearchGender("");
    setShowResults(false);
  };

  const hasActiveFilters = searchQuery || searchLocation || searchTag || searchBirthYear || searchGender;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Advanced Search</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Name/Notes/Email Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            Name / Notes / Email
          </Label>
          <Input
            placeholder="Search by name, notes, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
          />
        </div>

        {/* Location Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <Input
            placeholder="Search by location..."
            value={searchLocation}
            onChange={(e) => {
              setSearchLocation(e.target.value);
              setShowResults(true);
            }}
          />
        </div>

        {/* Tag Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4" />
            Tag
          </Label>
          <Input
            placeholder="Search by tag..."
            value={searchTag}
            onChange={(e) => {
              setSearchTag(e.target.value);
              setShowResults(true);
            }}
          />
        </div>

        {/* Birth Year */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Birth Year
          </Label>
          <Input
            type="number"
            placeholder="e.g., 1990"
            value={searchBirthYear}
            onChange={(e) => {
              setSearchBirthYear(e.target.value);
              setShowResults(true);
            }}
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label className="text-sm">Gender</Label>
          <select
            className="w-full px-3 py-2 border rounded-md text-sm"
            value={searchGender}
            onChange={(e) => {
              setSearchGender(e.target.value);
              setShowResults(true);
            }}
          >
            <option value="">All</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
      </div>

      {/* Search Results */}
      {showResults && hasActiveFilters && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </div>
          {searchResults.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName || 'Unknown')}`}
                      alt={member.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{member.fullName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        {member.birthDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {member.birthDate}
                          </span>
                        )}
                        {member.gender && (
                          <span>• {member.gender === 'M' ? 'Male' : 'Female'}</span>
                        )}
                        {member.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {typeof member.location === 'string' 
                              ? member.location 
                              : `${member.location.village}, ${member.location.district}`}
                          </span>
                        )}
                      </div>
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {member.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              No members found matching your search criteria
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
