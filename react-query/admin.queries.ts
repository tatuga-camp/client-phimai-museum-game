"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/react-query/keys";
import { ApiError } from "@/services/http";
import {
  adminLogin,
  getTasks,
  saveTask,
  deleteTask,
  getTeams,
  createTeam,
  getPlayers,
  bulkPlayers,
  resetPlayer,
  getLive,
  getReviews,
  override,
  adjust,
  uploadImage,
} from "@/services/admin.service";
import type {
  AdminTask,
  Team,
  PlayerRow,
  Live,
  Review,
  TeamInput,
  BulkPlayersInput,
  AdjustInput,
  OverrideInput,
  LoginResponse,
} from "@/types";

export const useAdminLogin = () =>
  useMutation<LoginResponse, ApiError, string>({ mutationFn: adminLogin });

export const useTasks = () =>
  useQuery<AdminTask[], ApiError>({
    queryKey: qk.admin.tasks,
    queryFn: getTasks,
  });

export const useSaveTask = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, Partial<AdminTask>>({
    mutationFn: saveTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.tasks }),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.tasks }),
  });
};

export const useTeams = () =>
  useQuery<Team[], ApiError>({ queryKey: qk.admin.teams, queryFn: getTeams });

export const useCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, TeamInput>({
    mutationFn: createTeam,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.teams }),
  });
};

export const usePlayers = () =>
  useQuery<PlayerRow[], ApiError>({
    queryKey: qk.admin.players,
    queryFn: getPlayers,
  });

export const useBulkPlayers = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, BulkPlayersInput>({
    mutationFn: bulkPlayers,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.players }),
  });
};

export const useResetPlayer = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: resetPlayer,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.players }),
  });
};

export const useLive = () =>
  useQuery<Live, ApiError>({
    queryKey: qk.admin.live,
    queryFn: getLive,
    refetchInterval: 5000,
  });

export const useReviews = () =>
  useQuery<Review[], ApiError>({
    queryKey: qk.admin.reviews,
    queryFn: getReviews,
    refetchInterval: 10000,
  });

export const useOverride = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, OverrideInput>({
    mutationFn: override,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admin.reviews });
      qc.invalidateQueries({ queryKey: qk.admin.live });
    },
  });
};

export const useAdjust = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, AdjustInput>({
    mutationFn: adjust,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.live }),
  });
};

export const useUploadImage = () =>
  useMutation<string, ApiError, File>({ mutationFn: uploadImage });
