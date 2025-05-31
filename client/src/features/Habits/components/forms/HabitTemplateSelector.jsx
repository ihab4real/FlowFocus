import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HABIT_TEMPLATES, HABIT_CATEGORIES } from "../../constants/habitConstants";
import { hexToRgba } from "../../utils/habitUtils";

/**
 * HabitTemplateSelector component for choosing from pre-built habit templates
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelectTemplate - Function to call when a template is selected
 * @param {React.ReactNode} props.trigger - Custom trigger element
 */
const HabitTemplateSelector = ({ onSelectTemplate, trigger }) => {
  const [open, setOpen] = React.useState(false);

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  // Group templates by category
  const templatesByCategory = HABIT_TEMPLATES.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Choose from Templates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Habit Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built habit to get started quickly.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4 -mr-4">
          <div className="space-y-6 py-2">
            {Object.keys(templatesByCategory).map((category) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">
                    {HABIT_CATEGORIES[category]?.icon || "⭐"}
                  </span>
                  <h3 className="text-lg font-semibold">{category}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templatesByCategory[category].map((template, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                      style={{
                        borderColor: template.color,
                        backgroundColor: hexToRgba(template.color, 0.05),
                      }}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          {template.type === "simple"
                            ? "Simple completion"
                            : template.type === "count"
                            ? `Count: ${template.targetValue} ${template.unit}`
                            : `Time: ${template.targetValue} ${template.unit}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HabitTemplateSelector;
