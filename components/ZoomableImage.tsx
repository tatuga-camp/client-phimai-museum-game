"use client";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type Props = {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
};

/**
 * A tappable image that opens fullscreen in a zoomable lightbox (pinch,
 * double-tap, wheel). Drop-in replacement for a plain <img> on non-interactive
 * task images — pass the same src/alt/style. The thumbnail and the fullscreen
 * slide share the src (task thumbnails are only CSS-scaled, so full resolution
 * is already loaded).
 */
export default function ZoomableImage({ src, alt = "", style, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ cursor: "zoom-in", ...style }}
        onClick={() => setOpen(true)}
      />
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        plugins={[Zoom]}
        carousel={{ finite: true }}
        zoom={{ maxZoomPixelRatio: 3, doubleTapDelay: 300 }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
}
