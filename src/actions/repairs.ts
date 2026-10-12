"use server";

import { createEquipmentRequest, updateEquipmentRequestStatus } from "./equipment";

/**
 * Backward compatibility aliases:
 * Alihkan modul repairs lama ke equipment actions baru.
 */
export const createRepairTicket = createEquipmentRequest;
export const updateRepairStatus = updateEquipmentRequestStatus;

