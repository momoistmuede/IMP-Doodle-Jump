import type { GameEvent, GameState, MonsterKind } from '../game/engine';
import { ZONES } from '../game/zones';
import type { SoundName } from './effects';
import { sound } from './sound';

/** Seconds after losing the second-to-last heart at which the warning beeps (three times, then it stops). */
const WARNINGS = [0.45, 0.7, 0.95];

/** Each behaviour announces itself: phone ring, rustling paper, ticking clock, buzzing bug. */
const NEAR_SOUNDS: Record<MonsterKind, SoundName> = { wobbler: 'ring', flyer: 'rustle', chaser: 'tick', shooter: 'buzz' };

/** Stop the wind of the intro descent and the jetpack engine. */
let stopWind = () => {};
let stopJetpack = () => {};

/** Turns the events of one `update` into sounds (the engine itself stays silent and testable). */
export function playEventSounds(events: readonly GameEvent[], state: GameState) {
  for (const event of events) {
    switch (event.type) {
      case 'jump':
        // The most frequent sound: slightly varied pitch, so it does not get on the nerves.
        sound.play('jump', { detune: (Math.random() - 0.5) * 200 });
        break;
      case 'spring':
      case 'shoot':
      case 'break':
      case 'vanish':
      case 'parachuteOpen':
      case 'parachuteLand':
      case 'heart':
      case 'heartBonus':
      case 'points':
        sound.play(event.type);
        break;
      case 'introStart':
        // No zone music during the descent, only quiet wind.
        sound.stopMusic(1);
        stopWind();
        stopWind = sound.play('wind');
        break;
      case 'introLand':
        stopWind();
        sound.play('go');
        sound.playMusic(ZONES[0].track, 0);
        break;
      case 'jetpackStart':
        sound.play('jetpackIgnite');
        stopJetpack();
        stopJetpack = sound.play('jetpackLoop');
        break;
      case 'jetpackSputter':
        sound.play('jetpackSputter');
        break;
      case 'jetpackEnd':
        stopJetpack();
        sound.play('jetpackOff');
        break;
      case 'zoneEnter':
        sound.play('fanfare');
        sound.playMusic(ZONES[event.zone].track);
        break;
      case 'monsterNear':
        sound.play(NEAR_SOUNDS[event.kind]);
        break;
      case 'monsterHit':
        sound.play('monsterHit');
        break;
      case 'enemyShot':
        sound.play('zapp');
        break;
      case 'kill':
        sound.play(event.by === 'shot' ? 'killShot' : 'killStomp');
        break;
      case 'hurt':
        if (event.cause === 'spikes') {
          sound.play('spike');
        }
        sound.play(event.cause === 'fall' ? 'fall' : 'hurt');
        if (state.lives === 1) {
          WARNINGS.forEach((delay) => sound.play('warn', { delay }));
        }
        break;
      case 'death':
        sound.stopMusic(0);
        sound.play('gameOver', { delay: 0.2 });
        break;
    }
  }
}
