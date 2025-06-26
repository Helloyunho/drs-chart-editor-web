/* eslint-disable @typescript-eslint/no-redeclare */
export interface Seq9 {
  seq_version: number
  info: DrsInfo
  sequence_data: SequenceData
  extend_data: ExtendData
  rec_data: RecData
}

export interface DrsInfo {
  time_unit: number
  end_tick: number
  bpm_info: BpmInfo
  measure_info: MeasureInfo
}

export interface BpmInfo {
  bpm: Bpm[]
}
export interface Bpm {
  tick: number
  bpm: number
}

export interface MeasureInfo {
  measure: Measure[]
}
export interface Measure {
  tick: number
  num: number
  denomi: number
}

export interface SequenceData {
  step: Step[]
}
export interface Step {
  start_tick: number
  end_tick: number
  left_pos: number
  right_pos: number
  kind: StepKind
  player_id: PlayerID
  long_point?: LongPoint
}
export const StepKind = {
  Left: 1,
  Right: 2,
  Down: 3,
  Jump: 4,
}
export type StepKind = (typeof StepKind)[keyof typeof StepKind]
export const PlayerID = {
  Player1: 0,
  Player2: 1,
  IDK1: 2,
  IDK2: 3,
  IDK3: 4,
}
export type PlayerID = (typeof PlayerID)[keyof typeof PlayerID]
export interface LongPoint {
  point: Point[]
}
export interface Point {
  tick: number
  left_pos: number
  right_pos: number
  left_end_pos?: number
  right_end_pos?: number
}

export interface ExtendData {
  extend: Extend[]
}
export interface Extend {
  type: 'Vfx'
  tick: number
  param: VfxParam
}
export interface VfxParam {
  time: number
  kind: VfxKind
  layer_name: string
  id: number
  lane: 0 | 1 | 2 | 3
  speed: number
  color?: Color
}
export const VfxKind = {
  Background: 'Background',
  OverEffect: 'OverEffect',
  MiddleEffect: 'MiddleEffect',
}
export type VfxKind = (typeof VfxKind)[keyof typeof VfxKind]
export interface Color {
  red: number
  green: number
  blue: number
}

export interface RecData {
  clip: Clip
  effect: Effect[]
}
export interface Clip {
  start_time: number
  end_time: number
}
export interface Effect {
  tick: number
  time: number
  command: EffectCommand
}
export const EffectCommand = {
  JumpRightToLeft: 'Njmprl',
  JumpCenterToLeft: 'Njmpcl',
  JumpLeftToLeft: 'Njmpll',
  JumpLeftSide: 'Njmpls',
  JumpCenterSide: 'Njmpcs',
  JumpRightSide: 'Njmprs',
  DownLeft1: 'Ndwnl1',
  DownLeft2: 'Ndwnl2',
  DownRight1: 'Ndwnr1',
  DownRight2: 'Ndwnr2',
  DownCenter1: 'Ndwnc1',
  DownCenter2: 'Ndwnc2',
  TapCenterToLeft: 'Ntapcl',
  TapLeftToLeft: 'Ntapll',
  TapRightToLeft: 'Ntaprl',
  TapRightSide: 'Ntaprs',
  TapLeftSide: 'Ntapls',
  TapCenterSide: 'Ntapcs',
  SlideRightToLeft1: 'Nsldrl1',
  SlideRightToLeft2: 'Nsldrl2',
  SlideLeftToRight1: 'Nsldlr1',
  SlideLeftToRight2: 'Nsldlr2',
  SlideRightToRight1: 'Nsldrr1',
  SlideRightToRight2: 'Nsldrr2',
  SlideLeftToLeft1: 'Nsldll1',
  SlideLeftToLeft2: 'Nsldll2',
  SlideCenterToLeft1: 'Nsldcl1',
  SlideCenterToLeft2: 'Nsldcl2',
  SlideCenterToRight1: 'Nsldcr1',
  SlideCenterToRight2: 'Nsldcr2',
  SoftFlickLeft1: 'Nsftl1',
  SoftFlickLeft2: 'Nsftl2',
  SoftFlickRight1: 'Nsftr1',
  SoftFlickRight2: 'Nsftr2',
  LiftDownEast1: 'Nldne1',
  LiftDownEast2: 'Nldne2',
  LiftDownSouth1: 'Nldns1',
  LiftDownSouth2: 'Nldns2',
}
export type EffectCommand = (typeof EffectCommand)[keyof typeof EffectCommand]
