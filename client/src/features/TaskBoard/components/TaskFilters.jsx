import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Tag,
  AlertTriangle,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function TaskFilters({ onFilter, availableTags = [], onShowOverdue }) {
  const [searchText, setSearchText] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showOverdueTasks, setShowOverdueTasks] = useState(false);

  // Priority options
  const priorityOptions = ["High", "Medium", "Low"];

  // Memoize the filter update to avoid causing infinite loops
  const updateFilters = useCallback(() => {
    onFilter({
      searchText,
      priorities: selectedPriorities,
      tags: selectedTags,
      sort: sortBy ? { field: sortBy, order: sortOrder } : null,
    });
  }, [searchText, selectedPriorities, selectedTags, sortBy, sortOrder, onFilter]);

  // Update filters when any filter changes
  useEffect(() => {
    updateFilters();
  }, [updateFilters]);

  // Update overdue filter when changed - memoize this callback as well
  const updateOverdueFilter = useCallback(() => {
    if (onShowOverdue) {
      onShowOverdue(showOverdueTasks);
    }
  }, [showOverdueTasks, onShowOverdue]);

  useEffect(() => {
    updateOverdueFilter();
  }, [updateOverdueFilter]);

  // Handle priority selection toggle
  const togglePriority = (priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((p) => p !== priority);
      } else {
        return [...prev, priority];
      }
    });
  };

  // Handle tag selection toggle
  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Handle sort selection
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // New field, reset to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchText("");
    setSelectedPriorities([]);
    setSelectedTags([]);
    setSortBy("");
    setSortOrder("asc");
    setShowOverdueTasks(false);
  };

  // Handle overdue toggle change
  const handleOverdueChange = useCallback((checked) => {
    setShowOverdueTasks(checked);
  }, []);

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1 ${
                selectedPriorities.length > 0
                  ? "border-[#6C63FF] text-[#6C63FF]"
                  : ""
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Priority
              {selectedPriorities.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedPriorities.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorityOptions.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={selectedPriorities.includes(priority)}
                onCheckedChange={() => togglePriority(priority)}
                className="gap-2"
              >
                <Badge className={`${getPriorityColor(priority)} text-xs`}>
                  {priority}
                </Badge>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1 ${
                selectedTags.length > 0 ? "border-[#6C63FF] text-[#6C63FF]" : ""
              }`}
            >
              <Tag className="h-4 w-4" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[200px] overflow-y-auto p-1">
              {availableTags.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 text-center">
                  No tags available
                </div>
              ) : (
                availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  >
                    <span className="truncate">{tag}</span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1 ${
                sortBy ? "border-[#6C63FF] text-[#6C63FF]" : ""
              }`}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              Sort
              {sortBy && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {sortBy}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Sort Tasks</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => handleSortChange("dueDate")}
                className={sortBy === "dueDate" ? "bg-muted" : ""}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Due Date</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("priority")}
                className={sortBy === "priority" ? "bg-muted" : ""}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Priority</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("title")}
                className={sortBy === "title" ? "bg-muted" : ""}
              >
                <span className="ml-6">Title</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Overdue toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="overdue"
            checked={showOverdueTasks}
            onCheckedChange={handleOverdueChange}
          />
          <Label htmlFor="overdue" className="text-sm cursor-pointer">
            Overdue
          </Label>
        </div>

        {/* Clear filters button */}
        {(searchText ||
          selectedPriorities.length > 0 ||
          selectedTags.length > 0 ||
          sortBy ||
          showOverdueTasks) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {(selectedPriorities.length > 0 || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedPriorities.map((priority) => (
            <Badge
              key={`p-${priority}`}
              variant="secondary"
              className={`${getPriorityColor(
                priority
              )} text-xs flex items-center gap-1`}
            >
              {priority}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => togglePriority(priority)}
              />
            </Badge>
          ))}
          {selectedTags.map((tag) => (
            <Badge
              key={`t-${tag}`}
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskFilters;
