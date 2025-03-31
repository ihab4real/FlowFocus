import { useQuery } from "@tanstack/react-query";

// Example query key factory
export const exampleKeys = {
  all: ["examples"],
  lists: () => [...exampleKeys.all, "list"],
  list: (filters) => [...exampleKeys.lists(), { filters }],
  details: () => [...exampleKeys.all, "detail"],
  detail: (id) => [...exampleKeys.details(), id],
};

// Example query hook
export function useExample(id) {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn: async () => {
      // Replace with your actual API call
      const response = await fetch(`/api/examples/${id}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    // You can override default options from queryClient.js here
    // staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
