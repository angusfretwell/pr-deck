import {
  CheckIcon,
  FilterIcon,
  FilterRemoveIcon,
  PlusIcon,
} from "@primer/octicons-react";

import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { Count } from "@/components/command-palette/parts";
import { Checkbox } from "@/components/ui/checkbox";
import { facets, PROPERTIES, toggleValue } from "@/features/views/lib/filters";
import { useOrgList } from "@/pages/org/org-list-context";

function sentenceCase(name: string) {
  return name === "CI" ? name : name.toLowerCase();
}

export function useFilterCommands(
  needle: string,
  setQuery: (query: string) => void
) {
  const {
    state: { views, list, orgPrs },
    actions: { commit },
    meta: { viewer },
  } = useOrgList();

  const { filters } = views;

  const filterActions: PaletteCommand[] = [
    ...(needle
      ? []
      : PROPERTIES.map((property) => ({
          id: `prefill:${property.key}`,
          keywords: `filter by ${property.name}`,
          icon: <FilterIcon />,
          label: `Filter by ${sentenceCase(property.name)}…`,
          keepOpen: true,
          run: () => {
            setQuery(`${property.name} `);
          },
        }))),
    ...(views.filtersChanged
      ? [
          {
            id: "filters:reset",
            keywords: "clear filters remove reset",
            icon: <FilterRemoveIcon />,
            label: views.active ? "Reset filters" : "Clear filters",
            run: () => {
              commit(views.resetFilters());
            },
          },
          ...(views.active
            ? [
                {
                  id: "view:save",
                  keywords: "save view",
                  icon: <CheckIcon />,
                  label: `Save changes to ${views.active.name}`,
                  run: () => {
                    commit(views.save());
                  },
                },
              ]
            : []),
          {
            id: "view:new",
            keywords: "save as new view",
            icon: <PlusIcon />,
            label: "Save as new view",
            run: () => {
              commit(views.saveAsNew());
            },
          },
        ]
      : []),
  ];

  const filterValues: PaletteCommand[] = needle
    ? PROPERTIES.flatMap((property) =>
        facets(property, filters, list.scoped, orgPrs, viewer).map((facet) => ({
          id: `value:${property.key}:${facet.option.value}`,
          keywords: `filter ${property.name} ${facet.option.label}`,
          icon: <Checkbox checked={facet.checked} tabIndex={-1} aria-hidden />,
          label: (
            <span className="flex min-w-0 gap-1.5">
              <span className="text-muted-foreground shrink-0">
                {property.name}
              </span>
              <span className="truncate">{facet.option.label}</span>
            </span>
          ),
          end: <Count>{facet.count}</Count>,
          run: () => {
            commit(
              views.setFilters(
                toggleValue(filters, property.key, facet.option.value)
              )
            );
          },
        }))
      )
    : [];

  return [...filterActions, ...filterValues];
}
