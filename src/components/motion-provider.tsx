"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const entranceSelector = [
  ".axiss-motion-fade-up",
  ".axiss-motion-stat",
  ".axiss-motion-side",
  ".axiss-motion-bottom",
].join(",");

const cardSelector = ".axiss-motion-card";
const revealSelector = `${entranceSelector}, ${cardSelector}`;
const interactiveSelector = ".axiss-action-lift, .axiss-surface-row, .axiss-motion-card";

export function MotionProvider({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("axiss-gsap-enabled");
    return () => document.documentElement.classList.remove("axiss-gsap-enabled");
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(root.querySelectorAll(revealSelector), {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          clearProps: "filter,transform,opacity,visibility",
        });
        return;
      }

      const header = root.querySelector(".axiss-motion-header");
      const shell = root.querySelector(".axiss-motion-shell");

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (shell) {
        intro.from(shell, { autoAlpha: 0, y: 10, duration: 0.5 });
      }
      if (header) {
        intro.from(header, { autoAlpha: 0, y: -12, duration: 0.48 }, 0.05);
      }

      const revealTriggers: ScrollTrigger[] = [];
      const revealTargets: HTMLElement[] = [];
      const registerRevealTargets = (container: ParentNode = root) => {
        const elements = gsap.utils.toArray<HTMLElement>(
          container.querySelectorAll(revealSelector)
        );

        if (container instanceof HTMLElement && container.matches(revealSelector)) {
          elements.unshift(container);
        }

        elements.forEach((element, index) => {
          if (element.dataset.gsapReveal === "true") return;
          element.dataset.gsapReveal = "true";
          revealTargets.push(element);

          const isCard = element.matches(cardSelector);
          const trigger = ScrollTrigger.create({
            trigger: element,
            start: isCard ? "top 92%" : "top 88%",
            once: true,
            onEnter: () => {
              gsap.fromTo(
                element,
                {
                  autoAlpha: 0,
                  y: isCard ? 20 : 18,
                  scale: isCard ? 0.985 : 1,
                  filter: isCard ? "blur(5px)" : "blur(6px)",
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  delay: Math.min(index % 9, 8) * 0.035,
                  duration: isCard ? 0.62 : 0.64,
                  ease: "power3.out",
                  overwrite: "auto",
                  clearProps: "filter,visibility",
                }
              );
            },
          });

          revealTriggers.push(trigger);
        });
      };

      registerRevealTargets();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              registerRevealTargets(node);
            }
          });
        });
        ScrollTrigger.refresh();
      });

      observer.observe(root, { childList: true, subtree: true });

      const getInteractiveTarget = (event: Event) => {
        if (!(event.target instanceof HTMLElement)) return null;
        const target = event.target.closest<HTMLElement>(interactiveSelector);
        return target && root.contains(target) ? target : null;
      };

      const onPointerOver = (event: PointerEvent) => {
        const element = getInteractiveTarget(event);
        if (!element || element.contains(event.relatedTarget as Node | null)) return;

        const isCard = element.classList.contains("axiss-motion-card");
        gsap.to(element, {
          y: isCard ? -3 : -1.5,
          scale: isCard ? 1.006 : 1.01,
          duration: 0.22,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const onPointerOut = (event: PointerEvent) => {
        const element = getInteractiveTarget(event);
        if (!element || element.contains(event.relatedTarget as Node | null)) return;

        gsap.to(element, {
          y: 0,
          scale: 1,
          duration: 0.26,
          ease: "power2.out",
          overwrite: "auto",
          clearProps: "transform",
        });
      };

      const onPointerDown = (event: PointerEvent) => {
        const element = getInteractiveTarget(event);
        if (!element) return;

        gsap.to(element, {
          scale: 0.985,
          duration: 0.08,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      root.addEventListener("pointerover", onPointerOver);
      root.addEventListener("pointerout", onPointerOut);
      root.addEventListener("pointerdown", onPointerDown);
      root.addEventListener("pointerup", onPointerOver);

      ScrollTrigger.refresh();

      return () => {
        observer.disconnect();
        root.removeEventListener("pointerover", onPointerOver);
        root.removeEventListener("pointerout", onPointerOut);
        root.removeEventListener("pointerdown", onPointerDown);
        root.removeEventListener("pointerup", onPointerOver);
        revealTriggers.forEach((trigger) => trigger.kill());
        revealTargets.forEach((element) => {
          delete element.dataset.gsapReveal;
        });
      };
    },
    { scope: rootRef, dependencies: [pathname], revertOnUpdate: true }
  );

  return (
    <div ref={rootRef} className="axiss-motion-root">
      {children}
    </div>
  );
}
