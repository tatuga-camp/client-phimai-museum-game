"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/react-query/keys";
import { ApiError } from "@/services/http";
import {
  getMe,
  getGameState,
  join,
  submitAnswer,
  submitPhoto,
  type JoinInput,
  type SubmitAnswerInput,
} from "@/services/player.service";
import type { Me, GameState, JoinResponse, SubmitResult } from "@/types";

export const useMe = () => useQuery<Me, ApiError>({ queryKey: qk.me, queryFn: getMe });

export const useGameState = () =>
  useQuery<GameState, ApiError>({
    queryKey: qk.gameState,
    queryFn: getGameState,
    refetchInterval: 5000,
  });

export const useJoin = () =>
  useMutation<JoinResponse, ApiError, JoinInput>({ mutationFn: join });

export const useSubmitAnswer = () => {
  const qc = useQueryClient();
  return useMutation<SubmitResult, ApiError, SubmitAnswerInput>({
    mutationFn: submitAnswer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.gameState });
    },
  });
};

export const useSubmitPhoto = () =>
  useMutation<SubmitResult, ApiError, FormData>({ mutationFn: submitPhoto });
