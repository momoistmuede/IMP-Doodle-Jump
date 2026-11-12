"""
Generates the imp sprites in public/sprites from shared parts, so every imp has the same build and
the shirt (where render.ts draws the IMP logo) at the same anchor point (25, 30).

Body colours are placeholders that the game replaces per zone (zones.ts, imps): #ff0080 (body),
#800040 (shade) and #80ff00 (horns). Run: python3 scripts/imps.py
"""
from pathlib import Path

INK = '#3b3a2f'
BODY, SHADE, HORN = '#ff0080', '#800040', '#80ff00'
OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'

TAIL = (f'<path d="M34 34 C44 36 48 28 47 20" fill="none" stroke="{SHADE}" stroke-width="2.5" stroke-linecap="round"/>'
        f'<path d="M47 15 L51 22 L43 21 Z" fill="{SHADE}" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/>')
LEGS = (f'<g stroke="{INK}" stroke-width="1.5"><rect x="18" y="34" width="5" height="6" fill="{BODY}"/>'
        f'<rect x="27" y="34" width="5" height="6" fill="{BODY}"/>'
        f'<ellipse cx="20" cy="40" rx="4" ry="2" fill="#1a1a1a" stroke-width="1"/>'
        f'<ellipse cx="30" cy="40" rx="4" ry="2" fill="#1a1a1a" stroke-width="1"/></g>')


def arm(d):
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{BODY}" stroke-width="3" stroke-linecap="round"/>')


ARM_LEFT_DOWN = arm('M12 27 Q8 31 9 35')
ARM_LEFT_UP = arm('M12 26 Q7 22 9 15')
ARM_LEFT_FORWARD = arm('M12 27 Q8 30 6 33')
ARM_RIGHT_UP = arm('M38 26 Q43 22 41 15')
ARM_RIGHT_FORWARD = arm('M38 27 Q42 30 44 33')
SHIRT = (f'<path d="M15 21 L10 25 L13 30 L16 28 V37 H34 V28 L37 30 L40 25 L35 21 Q25 25 15 21 Z" '
         f'fill="#ffffff" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/>')
EARS = (f'<g stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"><path d="M13 9 L2 3 L12 16 Z" fill="{BODY}"/>'
        f'<path d="M37 9 L48 3 L38 16 Z" fill="{BODY}"/></g>')
HORNS = (f'<g stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"><path d="M17 3 Q13 -4 17 -9 Q18 -3 21 1 Z" fill="{HORN}"/>'
         f'<path d="M33 3 Q37 -4 33 -9 Q32 -3 29 1 Z" fill="{HORN}"/></g>')
HEAD = (f'<ellipse cx="25" cy="11" rx="12" ry="10" fill="{BODY}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M17 17 Q25 22 33 17" fill="none" stroke="{SHADE}" stroke-width="1.5"/>')
FACE = (f'<ellipse cx="21" cy="10" rx="3" ry="3.5" fill="#f1c40f" stroke="{INK}" stroke-width="1"/>'
        f'<ellipse cx="29" cy="10" rx="3" ry="3.5" fill="#f1c40f" stroke="{INK}" stroke-width="1"/>'
        '<rect x="20.4" y="7.5" width="1.4" height="5" rx="0.7" fill="#1a1a1a"/>'
        '<rect x="28.4" y="7.5" width="1.4" height="5" rx="0.7" fill="#1a1a1a"/>'
        '<path d="M20 15 Q25 19 30 15 Z" fill="#1a1a1a"/>'
        '<path d="M21.5 15.5 l1 2 l1 -1.6 Z M28.5 15.5 l-1 2 l-1 -1.6 Z" fill="#ffffff"/>')

PHONE = ('<g transform="rotate(-20 42 9)">'
         f'<rect x="39" y="0" width="6" height="18" rx="3" fill="#1a1a1a" stroke="{INK}" stroke-width="1"/>'
         '<rect x="37.5" y="-1" width="9" height="5" rx="2" fill="#1a1a1a"/>'
         '<rect x="37.5" y="14" width="9" height="5" rx="2" fill="#1a1a1a"/></g>'
         '<path d="M49 -3 q3 3 0 6 M52 -6 q5 6 0 12" fill="none" stroke="#f1c40f" stroke-width="1.6" stroke-linecap="round"/>')
PAGER = (f'<g transform="rotate(-12 42 10)"><rect x="36" y="6" width="12" height="9" rx="2" fill="#1a1a1a" stroke="{INK}" stroke-width="1"/>'
         '<rect x="38" y="8" width="8" height="4" fill="#50fa7b"/></g>'
         '<path d="M50 4 l3 -2 M51 9 h4 M50 14 l3 2" stroke="#e63946" stroke-width="1.6" stroke-linecap="round"/>')
CLOCK = (f'<circle cx="43" cy="9" r="8" fill="#ffffff" stroke="{INK}" stroke-width="2"/>'
         f'<path d="M43 9 V4 M43 9 L47 11" stroke="#c30827" stroke-width="1.6" stroke-linecap="round"/>'
         f'<rect x="41" y="-1.5" width="4" height="3" fill="{INK}"/>'
         '<path d="M52 2 l2 -2 M53 9 h3" stroke="#f1c40f" stroke-width="1.6" stroke-linecap="round"/>')
TARGET = (f'<circle cx="43" cy="9" r="8" fill="#ffffff" stroke="{INK}" stroke-width="1.5"/>'
          '<circle cx="43" cy="9" r="5.5" fill="#e63946"/><circle cx="43" cy="9" r="3" fill="#ffffff"/>'
          '<circle cx="43" cy="9" r="1.3" fill="#e63946"/>'
          f'<path d="M43 9 L54 -2" stroke="{INK}" stroke-width="1.5"/><path d="M54 -2 l-1 3 M54 -2 l-3 1" stroke="{INK}" stroke-width="1.5"/>')
EXCEPTION = (f'<rect x="3" y="7" width="9" height="11" rx="1.5" fill="#e63946" stroke="{INK}" stroke-width="1.5"/>'
             '<path d="M7.5 9.5 V14 M7.5 15.8 V16.2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>')
BEETLE_WINGS = (f'<g stroke="{INK}" stroke-width="1.5"><path d="M15 22 Q1 20 2 34 Q10 36 16 30 Z" fill="#3e7d1f"/>'
                f'<path d="M35 22 Q49 20 48 34 Q40 36 34 30 Z" fill="#3e7d1f"/></g>'
                '<path d="M6 26 Q8 30 12 30 M44 26 Q42 30 38 30" fill="none" stroke="#6fbf3a" stroke-width="1.2"/>')
ANTENNAE = (f'<path d="M21 2 Q18 -6 14 -8 M29 2 Q32 -6 36 -8" fill="none" stroke="{INK}" stroke-width="1.5"/>'
            f'<circle cx="14" cy="-8" r="1.8" fill="{INK}"/><circle cx="36" cy="-8" r="1.8" fill="{INK}"/>')
PLANE = (f'<path d="M-5 37 L55 34 L22 44 Z" fill="#ffffff" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/>'
         f'<path d="M-5 37 L22 40 L22 44" fill="#e6dfc8" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>'
         '<path d="M28 37.5 h12 M31 39.5 h6" stroke="#9d9e9e" stroke-width="1"/>')
NOTE = (f'<g transform="rotate(-4 25 39)"><rect x="-3" y="35" width="56" height="9" rx="1" fill="#f1c40f" stroke="{INK}" stroke-width="1.5"/>'
        f'<path d="M2 38 h14 M2 41 h22 M30 39.5 h6 M33 36.5 v6" stroke="{INK}" stroke-width="1.2"/>'
        '<path d="M53 37 l6 2.5 l-6 2.5 Z" fill="#f39c12"/></g>')


def imp(name, comment, before='', after='', legs=True, arms=(ARM_LEFT_DOWN, ARM_RIGHT_UP), horns=HORNS):
    left, right = arms
    body = (before + TAIL + (LEGS if legs else '') + left + SHIRT + EARS + horns + HEAD + FACE + right + after)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -12 62 56" width="62" height="56">'
           f'<!-- {comment} Generiert von scripts/imps.py; die Brust bleibt frei für das IMP-Logo. -->{body}</svg>\n')
    (OUT / f'imp-{name}.svg').write_text(svg)


imp('telefon', 'Telefon-Imp (wackelt).', after=PHONE)
imp('pager', 'Pager-Imp (wackelt, Operations).', after=PAGER)
imp('flieger', 'Flieger-Imp auf einem Papierflieger mit Änderungswunsch.', after=PLANE, legs=False,
    arms=(ARM_LEFT_FORWARD, ARM_RIGHT_FORWARD))
imp('feature', 'Feature-Request-Imp auf einem Post-it (fliegt, Produktmanagement).', after=NOTE, legs=False,
    arms=(ARM_LEFT_FORWARD, ARM_RIGHT_FORWARD))
imp('deadline', 'Deadline-Imp mit tickender Uhr (verfolgt).', after=CLOCK)
imp('quartalsziel', 'Quartalsziel-Imp mit Zielscheibe (verfolgt, Vertrieb).', after=TARGET)
imp('bug', 'Bug-Imp mit Käferflügeln, wirft Exceptions.', before=BEETLE_WINGS, after=EXCEPTION,
    arms=(ARM_LEFT_UP, ARM_RIGHT_UP), horns=ANTENNAE)
