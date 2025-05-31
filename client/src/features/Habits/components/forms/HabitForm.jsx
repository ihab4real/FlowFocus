import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HABIT_CATEGORIES, HABIT_TYPES } from "../../constants/habitConstants";

// Form validation schema
const habitFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Habit name must be at least 2 characters" })
    .max(50, { message: "Habit name must be less than 50 characters" }),
  description: z
    .string()
    .max(200, { message: "Description must be less than 200 characters" })
    .optional()
    .or(z.literal("")),
  category: z.string(),
  type: z.enum(["simple", "count", "time"]),
  targetValue: z.coerce
    .number()
    .min(1, { message: "Target value must be at least 1" })
    .default(1),
  unit: z.string().default("times"),
  color: z.string().default("#6C63FF"),
  isActive: z.boolean().default(true),
});

// Default form values
const DEFAULT_FORM_VALUES = {
  name: "",
  description: "",
  category: "Custom",
  type: "simple",
  targetValue: 1,
  unit: "times",
  color: "#6C63FF",
  isActive: true,
};

/**
 * HabitForm component for creating and editing habits
 *
 * @param {Object} props - Component props
 * @param {Object} props.defaultValues - Default values for the form (for editing)
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {boolean} props.isEditing - Whether the form is for editing an existing habit
 * @param {boolean} props.isLoading - Loading state for submit button
 */
const HabitForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}) => {
  const [habitType, setHabitType] = useState(
    () => defaultValues?.type || DEFAULT_FORM_VALUES.type
  );

  // Initialize the form with react-hook-form
  const form = useForm({
    resolver: zodResolver(habitFormSchema),
    defaultValues: defaultValues || DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  // Sync habitType when form values change (handles both manual input and external updates)
  const watchedType = form.watch("type");
  useEffect(() => {
    if (watchedType && watchedType !== habitType) {
      setHabitType(watchedType);
    }
  }, [watchedType, habitType]);

  // Handle form submission
  const handleSubmit = (data) => {
    onSubmit(data);
  };

  // Common unit options based on habit type
  const unitOptions = {
    simple: [{ label: "times", value: "times" }],
    count: [
      { label: "times", value: "times" },
      { label: "glasses", value: "glasses" },
      { label: "pages", value: "pages" },
      { label: "steps", value: "steps" },
    ],
    time: [
      { label: "minutes", value: "minutes" },
      { label: "hours", value: "hours" },
    ],
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5 max-h-[65vh] overflow-y-auto pr-1"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habit Name*</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Drink Water" {...field} />
              </FormControl>
              <FormDescription>
                Give your habit a clear, actionable name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Why this habit matters to you"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details about your habit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(HABIT_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{key}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Group your habits by area of life
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Habit Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setHabitType(value);

                    // Set default unit based on type
                    if (value === "time") {
                      form.setValue("unit", "minutes");
                    } else if (value === "count") {
                      form.setValue("unit", "times");
                    }
                  }}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(HABIT_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>How you'll track this habit</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {habitType !== "simple" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Target {habitType === "count" ? "Count" : "Time"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder={
                        habitType === "count" ? "e.g., 8" : "e.g., 30"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your daily goal for this habit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions[habitType].map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How you measure your progress
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer"
                    {...field}
                  />
                </FormControl>
                <div
                  className="flex-1 h-10 rounded-md border"
                  style={{ backgroundColor: field.value }}
                ></div>
              </div>
              <FormDescription>
                Choose a color to represent this habit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Active
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 ml-2 text-muted-foreground inline" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Inactive habits won't appear in your daily tracking,
                          but history is preserved
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormDescription>
                  Include this habit in your daily routine
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Separator className="my-4" />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isValid}>
            {isLoading
              ? "Saving..."
              : isEditing
                ? "Update Habit"
                : "Create Habit"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default HabitForm;
