import { BF, drawImpact, drawSmoke, enterBody, JAW_OPEN, type BfPose, type G } from './rig';
import { SvgSprite } from './svgSprite';

/*
 * Technique C · SVG illustration — Black Friday.
 * Parts are .svg files in public/proto/black-friday/ (editable in Figma or Inkscape),
 * drawn with the same rig transforms as technique A. At runtime: only drawImage
 * plus a few cheap particles (budget in FX_LIMITS).
 */

const sprite = new SvgSprite('/proto/black-friday/', {
  chassis: { vb: [-32, 30, 76, 24] },
  body: { vb: [-80, -80, 150, 125] },
  jaw: { vb: [-58, -16, 64, 44] },
  arm: { vb: [-66, -12, 80, 66] },
  tag: { vb: [-22, -2, 44, 52] },
  wheel: { vb: [-13, -13, 26, 26] },
});

/** Starts loading the SVG parts (once). */
export function loadSvgParts(): void {
  sprite.load();
}

/** Draws the whole character for a pose. Origin: character center, feet at y = 60. */
export function drawBlackFridaySvg(g: G, p: BfPose, t: number): void {
  if (!sprite.ready) {
    sprite.drawStatus(g);
    return;
  }
  drawSmoke(g, t);
  sprite.draw(g, 'chassis');
  g.save();
  g.translate(BF.backWheel[0], BF.backWheel[1]);
  g.rotate(p.wheel);
  sprite.draw(g, 'wheel');
  g.restore();
  g.save();
  g.translate(BF.frontWheel[0], BF.frontWheel[1]);
  g.rotate(0.35 + Math.sin(t * 9) * 0.05);
  g.scale(1, 0.8);
  g.rotate(p.wheel * 0.8);
  sprite.draw(g, 'wheel');
  g.restore();

  g.save();
  enterBody(g, p, t);
  sprite.draw(g, 'body');
  g.save();
  g.translate(BF.hinge[0], BF.hinge[1]);
  g.rotate(-p.jaw * JAW_OPEN);
  sprite.draw(g, 'jaw');
  g.restore();
  g.save();
  g.translate(BF.tagAnchor[0], BF.tagAnchor[1]);
  g.rotate(p.tag);
  sprite.draw(g, 'tag');
  g.restore();
  g.save();
  g.translate(BF.shoulder[0], BF.shoulder[1]);
  g.rotate(p.arm);
  sprite.draw(g, 'arm');
  g.restore();
  g.restore();
  drawImpact(g, p);
}
