"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Shuffle, ChevronDown, Check } from "lucide-react";
import { createScopedLogger } from "@/utils";
import { useState } from "react";
import { MODEL_LIST, getRandomModel, type ModelInfo } from "@/constants/models";
import { useTranslations } from "next-intl";

const logger = createScopedLogger("model-selector");

// Group models by their group
const groupedModels = MODEL_LIST.reduce(
  (acc, model) => {
    if (!acc[model.group]) {
      acc[model.group] = [];
    }
    acc[model.group].push(model);
    return acc;
  },
  {} as Record<string, ModelInfo[]>
);

interface ModelSelectorProps {
  value?: string | string[];
  onChange?: (
    value: string | string[],
    actualModel?: string | string[]
  ) => void;
  className?: string;
  placeholder?: string;
  multiple?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  className,
  placeholder,
  multiple = false,
}: ModelSelectorProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [internalRandomModel, setInternalRandomModel] = useState<string>();

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (newValue: string) => {
    if (newValue === "random") {
      const randomModel = getRandomModel(internalRandomModel);
      setInternalRandomModel(randomModel);
      onChange?.("random", randomModel);
    } else {
      setInternalRandomModel(undefined);
      if (multiple) {
        const newValues = selectedValues.includes(newValue)
          ? selectedValues.filter((v) => v !== newValue)
          : [...selectedValues, newValue];
        onChange?.(newValues, newValues);
      } else {
        onChange?.(newValue, newValue);
      }
    }
    if (!multiple) setOpen(false);
  };

  const getDisplayValue = () => {
    if (!Array.isArray(value) && value === "random") {
      return (
        <span className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 shrink-0" />
          <span>{t("random")}</span>
        </span>
      );
    }

    if (selectedValues.length > 0) {
      if (multiple) {
        return (
          <span className="flex items-center gap-2">
            <span>{t("selectedCount", { count: selectedValues.length })}</span>
          </span>
        );
      } else {
        const model = MODEL_LIST.find((m) => m.id === value);
        if (model) {
          const Icon = model.icon;
          return (
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{model.name}</span>
            </span>
          );
        }
      }
    }

    return (
      <span className="text-muted-foreground">
        {placeholder ?? t("selectModel")}
      </span>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background px-3 font-normal",
            className
          )}
        >
          {getDisplayValue()}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popper-anchor-width)] p-0">
        <Command
          loop
          shouldFilter={true}
          defaultValue=""
          value={Array.isArray(value) ? value[0] : value}
        >
          <CommandInput placeholder={t("searchModels")} />
          <CommandList>
            <CommandEmpty>{t("noModelFound")}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="random"
                onSelect={() => handleSelect("random")}
                className={cn(
                  "relative flex items-center gap-2",
                  (value === "random" ||
                    (value === "random" && internalRandomModel)) &&
                    "bg-accent"
                )}
              >
                <Shuffle className="h-4 w-4 shrink-0" />
                <span>{t("random")}</span>
                {value === "random" && (
                  <Check className="absolute right-2 h-4 w-4" />
                )}
              </CommandItem>
            </CommandGroup>
            {Object.entries(groupedModels).map(([group, groupModels]) => {
              const GroupIcon = groupModels[0].icon;
              return (
                <CommandGroup
                  key={group}
                  heading={
                    <span className="flex items-center gap-2">
                      <GroupIcon className="h-4 w-4" />
                      {group}
                    </span>
                  }
                >
                  {groupModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelect(model.id)}
                      className={cn(
                        "relative pl-8",
                        selectedValues.includes(model.id) && "bg-accent"
                      )}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            selectedValues.includes(model.id)
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          )}
                        >
                          {selectedValues.includes(model.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span>{model.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
