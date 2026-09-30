import { useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid, ListTree, MapPin, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AVAILABILITY_LABELS,
  DOCUMENT_TYPES,
  PART_STATUS_LABELS,
  SERVICE_LABELS,
  SORT_LABELS,
  TYPE_LABELS,
  type AvailabilityFacet,
  type PartStatusFacet,
  type PlantFacetCounts,
  type PlantFilters,
  type PlantItemType,
  type PlantScope,
  type PlantSortKey,
  type PlantTreeNode,
  type PlantViewMode,
  type ServiceFacet,
} from "@/lib/plant-filters";

export type PlantScopeLevel = "plant" | "furnace" | "line" | "machine";

export interface PlantScopeOption {
  id: string;
  label: string;
}

const ALL = "__all";

type ListFilterKey = Exclude<keyof PlantFilters, "inCart">;

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((candidate) => candidate !== value) : [...values, value];
}

function FacetGroup<T extends string>({ title, options, selected, onToggle }: {
  title: string;
  options: Array<{ value: T; label: string; count: number }>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</legend>
      {options.length ? options.map((option) => {
        const id = `plant-filter-${title}-${option.value}`.replace(/\s+/g, "-");
        const checked = selected.includes(option.value);
        const disabled = !checked && option.count === 0;
        return (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={() => onToggle(option.value)} />
            <Label htmlFor={id} className={`flex flex-1 items-center justify-between gap-2 text-sm font-normal ${disabled ? "text-muted-foreground" : ""}`}>
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.count}</span>
            </Label>
          </div>
        );
      }) : <p className="text-sm text-muted-foreground">No options in this scope.</p>}
    </fieldset>
  );
}

function ScopeSelect({ label, value, options, disabled, onChange }: {
  label: string;
  value?: string;
  options: PlantScopeOption[];
  disabled?: boolean;
  onChange: (id?: string) => void;
}) {
  const id = `plant-scope-${label.toLowerCase()}`;
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value ?? ALL} disabled={disabled || !options.length} onValueChange={(next) => onChange(next === ALL ? undefined : next)}>
        <SelectTrigger id={id} className="h-8"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
          {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterButton({ label, count, children, contentClassName }: { label: ReactNode; count: number; children: ReactNode; contentClassName?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant={count ? "secondary" : "outline"} className="h-9 max-w-72 gap-1.5">
          <span className="truncate">{label}</span>
          {count > 0 && <Badge variant="outline" className="h-5 bg-background px-1.5">{count}</Badge>}
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={contentClassName ?? "w-72"}>{children}</PopoverContent>
    </Popover>
  );
}

export interface PlantToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchResults?: PlantTreeNode[];
  onSelectSearchResult: (node: PlantTreeNode) => void;
  viewMode: PlantViewMode;
  onViewModeChange: (mode: PlantViewMode) => void;
  sort: PlantSortKey;
  onSortChange: (sort: PlantSortKey) => void;
  scope: PlantScope;
  scopeLabel?: string;
  plantOptions: PlantScopeOption[];
  furnaceOptions: PlantScopeOption[];
  lineOptions: PlantScopeOption[];
  machineOptions: PlantScopeOption[];
  onScopeChange: (level: PlantScopeLevel, id?: string) => void;
  filters: PlantFilters;
  onFiltersChange: (filters: PlantFilters) => void;
  counts: PlantFacetCounts;
  onClear: () => void;
}

export function PlantToolbar({
  query, onQueryChange, searchResults, onSelectSearchResult, viewMode, onViewModeChange, sort, onSortChange,
  scope, scopeLabel, plantOptions, furnaceOptions, lineOptions, machineOptions, onScopeChange,
  filters, onFiltersChange, counts, onClear,
}: PlantToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const toggle = <K extends ListFilterKey>(key: K, value: PlantFilters[K][number]) => onFiltersChange({ ...filters, [key]: toggleValue(filters[key] as Array<typeof value>, value) });
  const scopeDepth = [scope.plantId, scope.furnaceId, scope.lineId, scope.machineId].filter(Boolean).length;
  const moreCount = filters.partStatus.length + filters.categories.length + filters.documentTypes.length + filters.service.length + filters.years.length + (filters.inCart ? 1 : 0);
  const chips = [
    ...(scopeLabel ? [{ key: "scope", label: scopeLabel, onRemove: () => onScopeChange("plant") }] : []),
    ...filters.types.map((value) => ({ key: `type-${value}`, label: TYPE_LABELS[value], onRemove: () => toggle("types", value) })),
    ...filters.availability.map((value) => ({ key: `avail-${value}`, label: AVAILABILITY_LABELS[value], onRemove: () => toggle("availability", value) })),
    ...filters.partStatus.map((value) => ({ key: `status-${value}`, label: PART_STATUS_LABELS[value], onRemove: () => toggle("partStatus", value) })),
    ...filters.categories.map((value) => ({ key: `cat-${value}`, label: value, onRemove: () => toggle("categories", value) })),
    ...filters.documentTypes.map((value) => ({ key: `doc-${value}`, label: value, onRemove: () => toggle("documentTypes", value) })),
    ...filters.service.map((value) => ({ key: `svc-${value}`, label: SERVICE_LABELS[value], onRemove: () => toggle("service", value) })),
    ...filters.years.map((value) => ({ key: `year-${value}`, label: `Year ${value}`, onRemove: () => toggle("years", value) })),
    ...(filters.inCart ? [{ key: "cart", label: "Already in cart", onRemove: () => onFiltersChange({ ...filters, inCart: false }) }] : []),
  ];

  return (
    <div role="search" aria-label="Search and filter plant" className="space-y-3 border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1 basis-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search plant hierarchy"
            aria-controls={searchResults ? "plant-search-results" : undefined}
            aria-autocomplete="list"
            className="pl-9"
            placeholder="Search plants, furnaces, lines, equipment, parts..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {searchResults && (
            <div id="plant-search-results" className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto border bg-background shadow-lg" aria-label="Plant hierarchy search results">
              {searchResults.length ? searchResults.slice(0, 12).map((node) => (
                <button type="button" key={`${node.kind}-${node.id}`} className="flex w-full items-start justify-between gap-4 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent" onClick={() => onSelectSearchResult(node)}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{node.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{node.path.join(" / ")}</span>
                  </span>
                  <Badge variant="outline" className="shrink-0 capitalize">{node.kind}</Badge>
                </button>
              )) : <p className="px-3 py-4 text-sm text-muted-foreground">No hierarchy items match this search.</p>}
            </div>
          )}
        </div>
        <FilterButton label={<span className="flex min-w-0 items-center gap-1.5" title={scopeLabel}><MapPin className="size-3.5 shrink-0" /><span className="max-w-48 truncate">{scopeLabel ?? "All locations"}</span></span>} count={scopeDepth} contentClassName="w-80 space-y-3">
          <ScopeSelect label="Plant" value={scope.plantId} options={plantOptions} onChange={(id) => onScopeChange("plant", id)} />
          <ScopeSelect label="Furnace" value={scope.furnaceId} options={furnaceOptions} disabled={!scope.plantId} onChange={(id) => onScopeChange("furnace", id)} />
          <ScopeSelect label="Line" value={scope.lineId} options={lineOptions} disabled={!scope.plantId} onChange={(id) => onScopeChange("line", id)} />
          <ScopeSelect label="Machine" value={scope.machineId} options={machineOptions} disabled={!scope.plantId} onChange={(id) => onScopeChange("machine", id)} />
        </FilterButton>
        <FilterButton label="Type" count={filters.types.length}>
          <FacetGroup title="Type" selected={filters.types} onToggle={(value) => toggle("types", value)}
            options={(Object.keys(TYPE_LABELS) as PlantItemType[]).map((value) => ({ value, label: TYPE_LABELS[value], count: counts.types.get(value) ?? 0 }))} />
        </FilterButton>
        <FilterButton label="Availability" count={filters.availability.length}>
          <FacetGroup title="Availability" selected={filters.availability} onToggle={(value) => toggle("availability", value)}
            options={(Object.keys(AVAILABILITY_LABELS) as AvailabilityFacet[]).map((value) => ({ value, label: AVAILABILITY_LABELS[value], count: counts.availability.get(value) ?? 0 }))} />
        </FilterButton>
        <Button type="button" variant={moreCount ? "secondary" : "outline"} className="h-9 gap-1.5" aria-expanded={moreOpen} aria-controls="plant-more-filters" onClick={() => setMoreOpen((open) => !open)}>
          <SlidersHorizontal className="size-3.5" />More filters
          {moreCount > 0 && <Badge variant="outline" className="h-5 bg-background px-1.5">{moreCount}</Badge>}
          <ChevronDown className={`size-3.5 opacity-60 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </Button>
        <Select value={sort} onValueChange={(value) => onSortChange(value as PlantSortKey)}>
          <SelectTrigger aria-label="Sort by" className="h-9 w-auto min-w-44 shrink-0 gap-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as PlantSortKey[]).map((value) => <SelectItem key={value} value={value}>{SORT_LABELS[value]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="inline-flex shrink-0 items-center gap-1" role="group" aria-label="Plant view">
          <Button type="button" size="icon" className="size-9" variant={viewMode === "tiles" ? "secondary" : "ghost"} aria-label="Tiles view" title="Tiles view" aria-pressed={viewMode === "tiles"} onClick={() => onViewModeChange("tiles")}><LayoutGrid className="size-4" /></Button>
          <Button type="button" size="icon" className="size-9" variant={viewMode === "tree" ? "secondary" : "ghost"} aria-label="Tree view" title="Tree view" aria-pressed={viewMode === "tree"} onClick={() => onViewModeChange("tree")}><ListTree className="size-4" /></Button>
        </div>
      </div>

      {moreOpen && (
        <div id="plant-more-filters" className="grid gap-6 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <FacetGroup title="Part status" selected={filters.partStatus} onToggle={(value) => toggle("partStatus", value)}
            options={(Object.keys(PART_STATUS_LABELS) as PartStatusFacet[]).map((value) => ({ value, label: PART_STATUS_LABELS[value], count: counts.partStatus.get(value) ?? 0 }))} />
          <FacetGroup title="Part category" selected={filters.categories} onToggle={(value) => toggle("categories", value)}
            options={Array.from(counts.categories).sort(([a], [b]) => a.localeCompare(b)).map(([value, count]) => ({ value, label: value, count }))} />
          <FacetGroup title="Documents" selected={filters.documentTypes} onToggle={(value) => toggle("documentTypes", value)}
            options={DOCUMENT_TYPES.map((value) => ({ value, label: value, count: counts.documentTypes.get(value) ?? 0 }))} />
          <FacetGroup title="Service" selected={filters.service} onToggle={(value) => toggle("service", value)}
            options={(Object.keys(SERVICE_LABELS) as ServiceFacet[]).map((value) => ({ value, label: SERVICE_LABELS[value], count: counts.service.get(value) ?? 0 }))} />
          <FacetGroup title="Installed / manufactured" selected={filters.years} onToggle={(value) => toggle("years", value)}
            options={Array.from(counts.years).sort(([a], [b]) => b.localeCompare(a)).map(([value, count]) => ({ value, label: value, count }))} />
          <FacetGroup title="Cart" selected={filters.inCart ? ["in-cart"] : []} onToggle={() => onFiltersChange({ ...filters, inCart: !filters.inCart })}
            options={[{ value: "in-cart", label: "Already in cart", count: counts.inCart }]} />
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3" aria-label="Active filters">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button type="button" className="rounded-sm p-0.5 hover:bg-background" aria-label={`Remove filter ${chip.label}`} onClick={chip.onRemove}><X className="size-3" /></button>
            </Badge>
          ))}
          <Button type="button" variant="link" size="sm" className="h-auto px-1" onClick={onClear}>Clear all</Button>
        </div>
      )}
    </div>
  );
}
