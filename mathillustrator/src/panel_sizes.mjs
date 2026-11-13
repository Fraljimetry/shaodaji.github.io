/** Browser-local editor panel widths. Pure and independent of drawing state. */
export const PANEL_MIN = 190;
export const PANEL_MAX = 620;
export const CANVAS_MIN = 240;
export const COLLAPSED_RAIL = 52;

/** Ignore malformed, nonfinite and out-of-range persisted values. */
export function validPanelWidth(value) {
 return typeof value === 'number' && Number.isFinite(value) && value >= PANEL_MIN && value <= PANEL_MAX
  ? Math.round(value) : null;
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Fit open panels to the current viewport without changing their saved ideal
 * widths. During a user drag/keyboard gesture, prioritize the active panel
 * while holding the other panel at its currently displayed width.
 */
export function fitPanels(total, requestedLeft, requestedRight, leftCollapsed = false, rightCollapsed = false, priority = null) {
 const available = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0) - CANVAS_MIN);
 const leftIdeal = clamp(validPanelWidth(requestedLeft) ?? 310, PANEL_MIN, PANEL_MAX);
 const rightIdeal = clamp(validPanelWidth(requestedRight) ?? 305, PANEL_MIN, PANEL_MAX);
 let left = leftCollapsed ? COLLAPSED_RAIL : leftIdeal;
 let right = rightCollapsed ? COLLAPSED_RAIL : rightIdeal;
 if (!leftCollapsed && !rightCollapsed) {
  if (priority === 'left') {
   right = clamp(right, PANEL_MIN, Math.max(PANEL_MIN, available - PANEL_MIN));
   left = clamp(left, PANEL_MIN, Math.max(PANEL_MIN, available - right));
  } else if (priority === 'right') {
   left = clamp(left, PANEL_MIN, Math.max(PANEL_MIN, available - PANEL_MIN));
   right = clamp(right, PANEL_MIN, Math.max(PANEL_MIN, available - left));
  } else if (left + right > available) {
   const extra = Math.max(0, available - 2 * PANEL_MIN);
   const leftExtra = left - PANEL_MIN, rightExtra = right - PANEL_MIN;
   const sum = leftExtra + rightExtra;
   left = PANEL_MIN + (sum ? Math.round(extra * leftExtra / sum) : Math.floor(extra / 2));
   right = PANEL_MIN + extra - (left - PANEL_MIN);
  }
 } else if (!leftCollapsed) left = clamp(left, PANEL_MIN, Math.max(PANEL_MIN, available - COLLAPSED_RAIL));
 else if (!rightCollapsed) right = clamp(right, PANEL_MIN, Math.max(PANEL_MIN, available - COLLAPSED_RAIL));
 return {
  left, right,
  leftMax: leftCollapsed ? COLLAPSED_RAIL : Math.min(PANEL_MAX, Math.max(PANEL_MIN, available - right)),
  rightMax: rightCollapsed ? COLLAPSED_RAIL : Math.min(PANEL_MAX, Math.max(PANEL_MIN, available - left)),
 };
}
