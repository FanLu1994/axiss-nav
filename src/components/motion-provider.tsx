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
const ambientSelector = ".axiss-light-field, .axiss-grid-field, .axiss-beam-field";
const brandSelector = ".axiss-brand-mark";
const statusSelector = ".axiss-status-breathe";
const highlightSelector = ".axiss-highlight-pulse";
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
      const motionSelectors = `${revealSelector}, ${ambientSelector}, ${brandSelector}, ${statusSelector}`;

      if (reduceMotion) {
        gsap.set(root.querySelectorAll(motionSelectors), {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          rotationX: 0,
          clearProps: "filter,transform,opacity,visibility",
        });
        return;
      }

      const header = root.querySelector(".axiss-motion-header");
      const shell = root.querySelector(".axiss-motion-shell");
      const lightField = root.querySelector(".axiss-light-field");
      const gridField = root.querySelector(".axiss-grid-field");
      const beamField = root.querySelector(".axiss-beam-field");

      const ambientTimeline = gsap.timeline();

      if (lightField) {
        ambientTimeline.fromTo(
          lightField,
          { autoAlpha: 0, xPercent: -7, yPercent: -4, scale: 1.08, rotation: -2 },
          {
            autoAlpha: 0.42,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotation: 0,
            duration: 1.4,
            ease: "expo.out",
          },
          0
        );
        gsap.to(lightField, {
          xPercent: 5,
          yPercent: 3,
          rotation: 1.6,
          scale: 1.05,
          duration: 14,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (gridField) {
        ambientTimeline.fromTo(
          gridField,
          { autoAlpha: 0, scale: 1.04 },
          { autoAlpha: 0.24, scale: 1, duration: 1.1, ease: "power3.out" },
          0.1
        );
        gsap.to(gridField, {
          backgroundPosition: "112px 56px, 112px 56px",
          duration: 24,
          ease: "none",
          repeat: -1,
        });
      }

      if (beamField) {
        ambientTimeline.fromTo(
          beamField,
          { autoAlpha: 0, xPercent: -8 },
          { autoAlpha: 0.2, xPercent: 0, duration: 1.2, ease: "power3.out" },
          0.18
        );
        gsap.to(beamField, {
          xPercent: 6,
          yPercent: -2,
          duration: 11,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      if (shell) {
        intro.from(shell, {
          autoAlpha: 0,
          y: 24,
          scale: 0.985,
          filter: "blur(12px)",
          duration: 0.95,
          clearProps: "filter,visibility",
        });
      }
      if (header) {
        intro.from(
          header,
          {
            autoAlpha: 0,
            y: -42,
            filter: "blur(10px)",
            duration: 0.82,
            clearProps: "filter,visibility",
          },
          0.08
        );
      }

      const brandMarks = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(brandSelector));
      brandMarks.forEach((brand, index) => {
        gsap.fromTo(
          brand,
          { autoAlpha: 0, y: 16, scale: 0.82, rotation: -8 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.72,
            delay: 0.08 + index * 0.04,
            ease: "back.out(1.8)",
            overwrite: "auto",
          }
        );
        gsap.to(brand, {
          "--axiss-brand-sheen-x": "82%",
          "--axiss-brand-sheen-opacity": 0.78,
          duration: 1.15,
          delay: 0.45 + index * 0.08,
          ease: "power3.inOut",
          repeat: -1,
          repeatDelay: 5.2,
          onRepeat: () => {
            gsap.set(brand, {
              "--axiss-brand-sheen-x": "-82%",
              "--axiss-brand-sheen-opacity": 0,
            });
          },
          onComplete: () => {
            gsap.set(brand, { "--axiss-brand-sheen-opacity": 0 });
          },
        });
      });

      const revealTriggers: ScrollTrigger[] = [];
      const revealTargets: HTMLElement[] = [];
      const statusTargets: HTMLElement[] = [];
      const highlightTargets: HTMLElement[] = [];
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
          const isSide = element.classList.contains("axiss-motion-side");
          const isBottom = element.classList.contains("axiss-motion-bottom");
          const isStat = element.classList.contains("axiss-motion-stat");

          const trigger = ScrollTrigger.create({
            trigger: element,
            start: isCard ? "top 94%" : "top 90%",
            once: true,
            onEnter: () => {
              gsap.fromTo(
                element,
                {
                  autoAlpha: 0,
                  x: isSide ? 42 : 0,
                  y: isBottom ? 38 : isCard ? 56 : 30,
                  scale: isCard ? 0.94 : isStat ? 0.96 : 0.98,
                  rotationX: isCard ? 7 : 0,
                  transformPerspective: isCard ? 800 : 0,
                  filter: isCard ? "blur(14px)" : "blur(10px)",
                },
                {
                  autoAlpha: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotationX: 0,
                  filter: "blur(0px)",
                  delay: Math.min(index % 9, 8) * (isCard ? 0.055 : 0.045),
                  duration: isCard ? 0.9 : 0.78,
                  ease: isCard ? "back.out(1.18)" : "expo.out",
                  overwrite: "auto",
                  clearProps: "filter,visibility,transformPerspective",
                }
              );
            },
          });

          revealTriggers.push(trigger);
        });
      };

      const registerStatusMotion = (container: ParentNode = root) => {
        const statuses = gsap.utils.toArray<HTMLElement>(
          container.querySelectorAll(statusSelector)
        );

        if (container instanceof HTMLElement && container.matches(statusSelector)) {
          statuses.unshift(container);
        }

        statuses.forEach((element) => {
          if (element.dataset.gsapStatus === "true") return;
          element.dataset.gsapStatus = "true";
          statusTargets.push(element);
          gsap.to(element, {
            y: -2,
            scale: 1.025,
            duration: 1.8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });
      };

      const registerHighlightMotion = (container: ParentNode = root) => {
        const highlighted = gsap.utils.toArray<HTMLElement>(
          container.querySelectorAll(highlightSelector)
        );

        if (container instanceof HTMLElement && container.matches(highlightSelector)) {
          highlighted.unshift(container);
        }

        highlighted.forEach((element) => {
          if (element.dataset.gsapHighlight === "true") return;
          element.dataset.gsapHighlight = "true";
          highlightTargets.push(element);
          gsap
            .timeline()
            .fromTo(
              element,
              {
                boxShadow: "0 0 0 0 rgba(45,111,104,0), 0 20px 54px rgba(31,43,50,0.12)",
              },
              {
                boxShadow: "0 0 0 10px rgba(45,111,104,0.16), 0 28px 70px rgba(31,43,50,0.18)",
                duration: 0.46,
                ease: "power2.out",
              }
            )
            .to(element, {
              boxShadow: "0 0 0 0 rgba(45,111,104,0), 0 20px 54px rgba(31,43,50,0.12)",
              duration: 0.62,
              ease: "power2.inOut",
            })
            .repeat(1);
        });
      };

      registerRevealTargets();
      registerStatusMotion();
      registerHighlightMotion();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              registerRevealTargets(node);
              registerStatusMotion(node);
              registerHighlightMotion(node);
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
          y: isCard ? -7 : -3,
          scale: 1.025,
          rotationX: isCard ? -1.5 : 0,
          duration: 0.28,
          ease: "power3.out",
          overwrite: "auto",
        });

        const icon = element.querySelector(".axiss-icon-drift");
        if (icon) {
          gsap.to(icon, {
            x: 4,
            y: -4,
            rotation: 12,
            duration: 0.28,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      };

      const onPointerOut = (event: PointerEvent) => {
        const element = getInteractiveTarget(event);
        if (!element || element.contains(event.relatedTarget as Node | null)) return;

        gsap.to(element, {
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 0.32,
          ease: "power3.out",
          overwrite: "auto",
          clearProps: "transform",
        });

        const icon = element.querySelector(".axiss-icon-drift");
        if (icon) {
          gsap.to(icon, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.3,
            ease: "power3.out",
            overwrite: "auto",
            clearProps: "transform",
          });
        }
      };

      const onPointerDown = (event: PointerEvent) => {
        const element = getInteractiveTarget(event);
        if (!element) return;

        gsap.to(element, {
          scale: 0.96,
          duration: 0.1,
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
        statusTargets.forEach((element) => {
          delete element.dataset.gsapStatus;
        });
        highlightTargets.forEach((element) => {
          delete element.dataset.gsapHighlight;
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
