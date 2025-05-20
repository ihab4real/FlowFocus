import { describe, it, expect } from "@jest/globals";
import {
  getPriorityColor,
  groupTasksByStatus,
  isTaskOverdue,
  sortTasks,
  filterTasks,
  extractUniqueTags,
  groupTasksByPriority,
  statusMap,
} from "../../utils/taskUtils";
import { addDays, subDays, formatISO } from "date-fns";
import { createMockTask, createMockTasks } from "../setup/testUtils";

describe("Task Utility Functions", () => {
  describe("getPriorityColor", () => {
    it("should return the correct color class for high priority", () => {
      expect(getPriorityColor("High")).toBe(
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      );
      expect(getPriorityColor("high")).toBe(
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      );
    });

    it("should return the correct color class for medium priority", () => {
      expect(getPriorityColor("Medium")).toBe(
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      );
      expect(getPriorityColor("medium")).toBe(
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      );
    });

    it("should return the correct color class for low priority", () => {
      expect(getPriorityColor("Low")).toBe(
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      );
      expect(getPriorityColor("low")).toBe(
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      );
    });

    it("should return default color class for unknown priority", () => {
      expect(getPriorityColor("Unknown")).toBe(
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      );
      expect(getPriorityColor(null)).toBe(
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      );
      expect(getPriorityColor(undefined)).toBe(
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      );
    });
  });

  describe("groupTasksByStatus", () => {
    it("should group tasks by their status", () => {
      const tasks = [
        createMockTask({ status: "Todo" }),
        createMockTask({ status: "Doing" }),
        createMockTask({ status: "Todo" }),
        createMockTask({ status: "Done" }),
      ];

      const grouped = groupTasksByStatus(tasks);

      expect(grouped).toHaveLength(3);
      expect(grouped[0].id).toBe("todo");
      expect(grouped[0].title).toBe("To Do");
      expect(grouped[0].tasks).toHaveLength(2);
      expect(grouped[1].id).toBe("in-progress");
      expect(grouped[1].title).toBe("In Progress");
      expect(grouped[1].tasks).toHaveLength(1);
      expect(grouped[2].id).toBe("done");
      expect(grouped[2].title).toBe("Done");
      expect(grouped[2].tasks).toHaveLength(1);
    });

    it("should handle empty task arrays", () => {
      const grouped = groupTasksByStatus([]);

      expect(grouped).toHaveLength(3);
      expect(grouped[0].tasks).toHaveLength(0);
      expect(grouped[1].tasks).toHaveLength(0);
      expect(grouped[2].tasks).toHaveLength(0);
    });
  });

  describe("isTaskOverdue", () => {
    it("should return true for overdue tasks", () => {
      const yesterday = subDays(new Date(), 1);
      const overdueTask = createMockTask({
        dueDate: formatISO(yesterday),
        status: "Todo",
      });

      expect(isTaskOverdue(overdueTask)).toBe(true);
    });

    it("should return false for future due dates", () => {
      const tomorrow = addDays(new Date(), 1);
      const futureTask = createMockTask({
        dueDate: formatISO(tomorrow),
        status: "Todo",
      });

      expect(isTaskOverdue(futureTask)).toBe(false);
    });

    it("should return false for completed tasks even if past due date", () => {
      const yesterday = subDays(new Date(), 1);
      const completedOverdueTask = createMockTask({
        dueDate: formatISO(yesterday),
        status: "Done",
      });

      expect(isTaskOverdue(completedOverdueTask)).toBe(false);
    });

    it("should return false for tasks with no due date", () => {
      const taskWithNoDueDate = createMockTask({ dueDate: null });
      expect(isTaskOverdue(taskWithNoDueDate)).toBe(false);
    });

    it("should handle invalid date formats", () => {
      const taskWithInvalidDate = createMockTask({ dueDate: "not-a-date" });
      // The function should handle the error internally and return false
      expect(isTaskOverdue(taskWithInvalidDate)).toBe(false);
    });
  });

  describe("sortTasks", () => {
    it("should sort tasks by priority", () => {
      const tasks = [
        createMockTask({ priority: "Low" }),
        createMockTask({ priority: "High" }),
        createMockTask({ priority: "Medium" }),
      ];

      const sortedAsc = sortTasks(tasks, "priority", "asc");
      expect(sortedAsc[0].priority).toBe("Low");
      expect(sortedAsc[1].priority).toBe("Medium");
      expect(sortedAsc[2].priority).toBe("High");

      const sortedDesc = sortTasks(tasks, "priority", "desc");
      expect(sortedDesc[0].priority).toBe("High");
      expect(sortedDesc[1].priority).toBe("Medium");
      expect(sortedDesc[2].priority).toBe("Low");
    });

    it("should sort tasks by due date", () => {
      const yesterday = subDays(new Date(), 1);
      const tomorrow = addDays(new Date(), 1);
      const nextWeek = addDays(new Date(), 7);

      // Format dates consistently for test
      const yesterdayISO = formatISO(yesterday);
      const tomorrowISO = formatISO(tomorrow);
      const nextWeekISO = formatISO(nextWeek);

      const tasks = [
        createMockTask({ dueDate: tomorrowISO }),
        createMockTask({ dueDate: yesterdayISO }),
        createMockTask({ dueDate: nextWeekISO }),
      ];

      const sortedAsc = sortTasks(tasks, "dueDate", "asc");
      expect(sortedAsc[0].dueDate).toBe(yesterdayISO);
      expect(sortedAsc[1].dueDate).toBe(tomorrowISO);
      expect(sortedAsc[2].dueDate).toBe(nextWeekISO);

      const sortedDesc = sortTasks(tasks, "dueDate", "desc");
      expect(sortedDesc[0].dueDate).toBe(nextWeekISO);
      expect(sortedDesc[1].dueDate).toBe(tomorrowISO);
      expect(sortedDesc[2].dueDate).toBe(yesterdayISO);
    });

    it("should sort tasks alphabetically by title", () => {
      const tasks = [
        createMockTask({ title: "Beta Task" }),
        createMockTask({ title: "Charlie Task" }),
        createMockTask({ title: "Alpha Task" }),
      ];

      const sortedAsc = sortTasks(tasks, "title", "asc");
      expect(sortedAsc[0].title).toBe("Alpha Task");
      expect(sortedAsc[1].title).toBe("Beta Task");
      expect(sortedAsc[2].title).toBe("Charlie Task");

      const sortedDesc = sortTasks(tasks, "title", "desc");
      expect(sortedDesc[0].title).toBe("Charlie Task");
      expect(sortedDesc[1].title).toBe("Beta Task");
      expect(sortedDesc[2].title).toBe("Alpha Task");
    });

    it("should return original array if no field specified", () => {
      const tasks = createMockTasks(3);
      const sorted = sortTasks(tasks);
      expect(sorted).toEqual(tasks);
    });
  });

  describe("filterTasks", () => {
    const tasks = [
      createMockTask({
        title: "Important meeting",
        priority: "High",
        tags: ["work", "meeting"],
      }),
      createMockTask({
        title: "Buy groceries",
        description: "Get milk and bread",
        priority: "Medium",
        tags: ["personal", "shopping"],
      }),
      createMockTask({
        title: "Read a book",
        priority: "Low",
        tags: ["personal", "leisure"],
      }),
    ];

    it("should filter tasks by search text in title", () => {
      const filtered = filterTasks(tasks, { searchText: "meeting" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Important meeting");
    });

    it("should filter tasks by search text in description", () => {
      const filtered = filterTasks(tasks, { searchText: "milk" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Buy groceries");
    });

    it("should filter tasks by priority", () => {
      const filtered = filterTasks(tasks, { priorities: ["High"] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe("High");

      const multipleFiltered = filterTasks(tasks, {
        priorities: ["High", "Medium"],
      });
      expect(multipleFiltered).toHaveLength(2);
    });

    it("should filter tasks by tags", () => {
      const filtered = filterTasks(tasks, { tags: ["personal"] });
      expect(filtered).toHaveLength(2);

      const multiTagsFiltered = filterTasks(tasks, {
        tags: ["work", "shopping"],
      });
      expect(multiTagsFiltered).toHaveLength(2);
    });

    it("should filter overdue tasks", () => {
      const yesterday = subDays(new Date(), 1);
      const overdueTask = createMockTask({
        dueDate: formatISO(yesterday),
        status: "Todo",
      });

      // Create a test suite of tasks including our overdue task
      const testTasks = [overdueTask];

      const filtered = filterTasks(testTasks, { showOverdue: true });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]._id).toBe(overdueTask._id);
    });

    it("should combine multiple filters", () => {
      const filtered = filterTasks(tasks, {
        searchText: "book",
        priorities: ["Low"],
        tags: ["personal"],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Read a book");
    });

    it("should return all tasks if no filters provided", () => {
      const filtered = filterTasks(tasks, {});
      expect(filtered).toHaveLength(tasks.length);

      const filteredNoArg = filterTasks(tasks);
      expect(filteredNoArg).toHaveLength(tasks.length);
    });
  });

  describe("extractUniqueTags", () => {
    it("should extract unique tags from tasks", () => {
      const tasks = [
        createMockTask({ tags: ["work", "meeting"] }),
        createMockTask({ tags: ["personal", "meeting"] }),
        createMockTask({ tags: ["work", "urgent"] }),
      ];

      const uniqueTags = extractUniqueTags(tasks);
      expect(uniqueTags).toHaveLength(4);
      expect(uniqueTags).toContain("work");
      expect(uniqueTags).toContain("meeting");
      expect(uniqueTags).toContain("personal");
      expect(uniqueTags).toContain("urgent");
    });

    it("should return an empty array if no tasks have tags", () => {
      // Directly create tasks without tags to avoid the default tags in createMockTask
      const tasks = [
        { _id: "1", title: "Task 1", tags: [] },
        { _id: "2", title: "Task 2" /* no tags property */ },
        { _id: "3", title: "Task 3", tags: undefined },
      ];

      const uniqueTags = extractUniqueTags(tasks);
      expect(uniqueTags).toHaveLength(0);
    });

    it("should return an empty array if tasks array is empty", () => {
      const uniqueTags = extractUniqueTags([]);
      expect(uniqueTags).toHaveLength(0);
    });
  });

  describe("groupTasksByPriority", () => {
    it("should group tasks by priority", () => {
      const tasks = [
        createMockTask({ priority: "High" }),
        createMockTask({ priority: "Medium" }),
        createMockTask({ priority: "Low" }),
        createMockTask({ priority: "High" }),
      ];

      const grouped = groupTasksByPriority(tasks);
      expect(grouped.high).toHaveLength(2);
      expect(grouped.medium).toHaveLength(1);
      expect(grouped.low).toHaveLength(1);
    });

    it("should handle empty task arrays", () => {
      const grouped = groupTasksByPriority([]);
      expect(grouped.high).toHaveLength(0);
      expect(grouped.medium).toHaveLength(0);
      expect(grouped.low).toHaveLength(0);
    });
  });

  describe("statusMap", () => {
    it("should map column IDs to status values", () => {
      // Test that column IDs map to the correct status values
      expect(statusMap.todo).toBe("Todo");
      expect(statusMap["in-progress"]).toBe("Doing");
      expect(statusMap.done).toBe("Done");
    });
  });
});
