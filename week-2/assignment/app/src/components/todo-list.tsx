"use client";

import useAnchorProvider from "@/hooks/use-anchor-provider";
import TodoProgram from "@/lib/todo-program";
import { Center, Flex, List, Spinner, Text, useToast } from "@chakra-ui/react";
import { IdlAccounts } from "@coral-xyz/anchor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IDL } from "../../../target/types/todo_app";
import TodoItem from "./todo-item";

export default function TodoList({
  profile,
}: {
  profile: IdlAccounts<typeof IDL>["profile"];
}) {
  const toast = useToast();

  const provider = useAnchorProvider();
  const todoProgram = new TodoProgram(provider);
  const { data: todos, isLoading, refetch } = useQuery({
    queryKey: ["todos", profile.key.toBase58(), profile.todoCount],
    enabled: !!profile,
    queryFn: () => todoProgram.fetchTodos(profile),
  });
  const queryClient = useQueryClient();

  const { mutateAsync: toggleTodoMutateAsync, isPending: isToggleTodoPending } = useMutation({
    mutationKey: ["update-todo", provider.publicKey, profile.todoCount],
    mutationFn: async (idx: number) => {
      try {
        const tx = await todoProgram.toggleTodoStatus(idx);
        const signature = await provider.sendAndConfirm(tx);

        return signature;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (tx) => {
      console.log(tx);

      toast({
        title: "Transaction sent",
        status: "success",
      });

      return queryClient.invalidateQueries({
        queryKey: ["profile", provider.publicKey.toBase58()],
      });
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      refetch();
    },
  });

  const { mutateAsync: deleteTodoMutateAsync, isPending: isDeleteTodoPending } = useMutation({
    mutationKey: ["delete-todo", provider.publicKey, profile.todoCount],
    mutationFn: async (idx: number) => {
      try {
        const tx = await todoProgram.deleteTodo(idx);
        const signature = await provider.sendAndConfirm(tx);

        return signature;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (tx) => {
      console.log(tx);

      toast({
        title: "Transaction sent",
        status: "success",
      });

      return queryClient.invalidateQueries({
        queryKey: ["profile", provider.publicKey.toBase58()],
      });
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      refetch();
    },
  });
  if (isLoading || isDeleteTodoPending || isToggleTodoPending) {
    return (
      <Center as={Flex} direction="column" gap={4} py={8}>
        <Spinner size="xl" colorScheme="blue" />
        <Text>Loading...</Text>
      </Center>
    );
  }

  console.log("todos", todos?.length);

  return (
    <List>
      {todos?.map((todo, idx) => (
        <TodoItem 
          key={idx}
          content={todo.content}
          completed={todo.completed}
          onToggle={async () => {
            toggleTodoMutateAsync(idx)
          }}
          onDelete={async () => {
            deleteTodoMutateAsync(idx)
          }}
        />
      ))}
    </List>
  );
}
