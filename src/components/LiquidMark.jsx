import { LiquidMetal } from "@paper-design/shaders-react";

// The pulse mark as a liquid-metal surface. One WebGL context, used once.
export default function LiquidMark({ size = 340 }) {
  return (
    <LiquidMetal
      image="/mark.svg"
      colorBack="#00000000"
      colorTint="#c8f031"
      repetition={2.4}
      softness={0.5}
      shiftRed={0.3}
      shiftBlue={0.4}
      distortion={0.14}
      contour={0.6}
      angle={65}
      speed={0.5}
      scale={0.92}
      fit="contain"
      style={{ width: size, height: size }}
    />
  );
}
