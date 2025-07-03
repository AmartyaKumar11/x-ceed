import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  );
};

const HeroSection = React.forwardRef(function HeroSection(
  {
    className,
    title = "Build products for everyone",
    subtitle = {
      regular: "Designing your projects faster with ",
      gradient: "the largest figma UI kit.",
    },
    description = "Sed ut perspiciatis unde omnis iste natus voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
    ctaText = "Browse courses",
    ctaHref = "#",
    bottomImage = {
      light: "https://farmui.vercel.app/dashboard-light.png",
      dark: "https://farmui.vercel.app/dashboard.png",
    },
    gridOptions,
    ...props
  },
  ref
) {
  return (
    <div className={cn("relative", className)} ref={ref} {...props}>
      <div className="absolute top-0 z-[0] h-screen w-screen bg-background bg-gradient-to-b from-background to-muted" />
      <section className="relative max-w-full mx-auto z-1">
        <RetroGrid {...{
          ...gridOptions,
          lightLineColor: 'var(--border)',
          darkLineColor: 'var(--border)',
        }} />
        <div className="max-w-screen-xl z-10 mx-auto px-4 py-28 gap-12 md:px-8">
          <div className="space-y-5 max-w-3xl leading-0 lg:leading-5 mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-[Orbitron,sans-serif] font-bold text-primary">
              {title}
              <ChevronRight className="inline w-4 h-4 ml-2 align-middle" />
            </h1>
            <h2 className="text-3xl md:text-5xl font-[Orbitron,sans-serif] font-semibold text-foreground">
              {subtitle.regular}
              <span className="text-accent font-bold">{subtitle.gradient}</span>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              {description}
            </p>
            <div className="flex items-center justify-center mt-8">
              <Button size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg" asChild>
                <a href={ctaHref}>{ctaText}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});
HeroSection.displayName = "HeroSection";

export { HeroSection }; 