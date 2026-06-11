type Props = { caption: string; captionTh?: string };

/**
 * Animated "AI scanner" loading layer: dim wash, viewfinder corner brackets,
 * a sweeping scan line, and a caption with blinking dots. Render it inside a
 * `position: relative` container that holds the photo (or a placeholder).
 */
export default function AiScanOverlay({ caption, captionTh }: Props) {
  return (
    <div className="scan-overlay" role="status" aria-live="polite">
      <div className="scan-corner tl" />
      <div className="scan-corner tr" />
      <div className="scan-corner bl" />
      <div className="scan-corner br" />
      <div className="scan-line" />
      <div className="scan-caption">
        {caption}
        <span className="blink-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
        {captionTh && (
          <>
            <br />
            <span className="hint">{captionTh}</span>
          </>
        )}
      </div>
    </div>
  );
}
