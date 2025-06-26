import type { EffectCommand, Seq9, VfxKind } from '@/types/seq9'

export const parseKonamiXML = (xml: string) => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid XML format')
  }

  const data = doc.documentElement

  const parseElement = (element: Element) => {
    const obj: Record<string, unknown> = {}
    for (const child of element.children) {
      if (child.children.length > 0) {
        const parsed = parseElement(child)
        if (obj[child.tagName]) {
          if (!Array.isArray(obj[child.tagName])) {
            obj[child.tagName] = [obj[child.tagName]]
          }
          (obj[child.tagName] as unknown[]).push(parsed)
        } else {
          obj[child.tagName] = parsed
        }
      } else {
        const typeAttr = child.getAttribute('__type')
        if (typeAttr === 's32') {
          obj[child.tagName] = Number(child.textContent!)
        } else if (typeAttr === 'str') {
          obj[child.tagName] = child.textContent! || ''
        }
      }
    }
    return obj
  }

  return parseElement(data)
}

export const parseSeq9XML = (xml: string) => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid XML format')
  }

  const data = doc.documentElement

  const result: Seq9 = {
    seq_version: Number(data.querySelector('seq_version')!.textContent!),
    info: {
      time_unit: Number(data.querySelector('info > time_unit')!.textContent!),
      end_tick: Number(data.querySelector('info > end_tick')!.textContent!),
      bpm_info: {
        bpm: Array.from(data.querySelectorAll('info > bpm_info > bpm')).map(bpm => ({
          tick: Number(bpm.querySelector('tick')!.textContent!),
          bpm: Number(bpm.querySelector('bpm')!.textContent!) / 100
        }))
      },
      measure_info: {
        measure: Array.from(data.querySelectorAll('info > measure_info > measure')).map(measure => ({
          tick: Number(measure.querySelector('tick')!.textContent!),
          num: Number(measure.querySelector('num')!.textContent!),
          denomi: Number(measure.querySelector('denomi')!.textContent!)
        }))
      }
    },
    sequence_data: {
      step: Array.from(data.querySelectorAll('sequence_data > step')).map(step => ({
        start_tick: Number(step.querySelector('start_tick')!.textContent!),
        end_tick: Number(step.querySelector('end_tick')!.textContent!),
        left_pos: Number(step.querySelector('left_pos')!.textContent!),
        right_pos: Number(step.querySelector('right_pos')!.textContent!),
        kind: Number(step.querySelector('kind')!.textContent!) as 1 | 2 | 3 | 4, // StepKind
        player_id: Number(step.querySelector('player_id')!.textContent!) as 0 | 1 | 2 | 3 | 4, // PlayerID
        long_point: step.querySelector('long_point')
          ? {
              point: Array.from(step.querySelectorAll('long_point > point')).map(point => ({
                tick: Number(point.querySelector('tick')!.textContent!),
                left_pos: Number(point.querySelector('left_pos')!.textContent!),
                right_pos: Number(point.querySelector('right_pos')!.textContent!),
                left_end_pos: point.querySelector('left_end_pos') ? Number(point.querySelector('left_end_pos')!.textContent!) : undefined,
                right_end_pos: point.querySelector('right_end_pos')
                  ? Number(point.querySelector('right_end_pos')!.textContent!)
                  : undefined
              }))
            }
          : undefined
      }))
    },
    extend_data: {
      extend: Array.from(data.querySelectorAll('extend_data > extend')).map(extend => ({
        type: 'Vfx',
        tick: Number(extend.querySelector('tick')!.textContent!),
        param: {
          time: Number(extend.querySelector('param > time')!.textContent!),
          kind: extend.querySelector('param > kind')!.textContent! as VfxKind,
          layer_name: extend.querySelector('param > layer_name')!.textContent!,
          id: Number(extend.querySelector('param > id')!.textContent!),
          lane: Number(extend.querySelector('param > lane')!.textContent!) as 0 | 1 | 2 | 3, // VfxLane
          speed: Number(extend.querySelector('param > speed')!.textContent!),
          color: extend.querySelector('param > color')
            ? {
                red: Number(extend.querySelector('param > color > red')!.textContent!),
                green: Number(extend.querySelector('param > color > green')!.textContent!),
                blue: Number(extend.querySelector('param > color > blue')!.textContent!),
              }
            : undefined
        }
      }))
    },
    rec_data: {
      clip: {
        start_time: Number(data.querySelector('rec_data > clip > start_time')!.textContent!),
        end_time: Number(data.querySelector('rec_data > clip > end_time')!.textContent!),
      },
      effect: Array.from(data.querySelectorAll('rec_data > effect')).map(effect => ({
        tick: Number(effect.querySelector('tick')!.textContent!),
        time: Number(effect.querySelector('time')!.textContent!),
        command: effect.querySelector('command')!.textContent! as EffectCommand
      }))
    }
  }

  return result
}

export const exportSeq9XML = (seq9: Seq9): string => {
  const xmlDoc = document.implementation.createDocument('', '', null)
  const root = xmlDoc.createElement('data')

  const createElement = (name: string, value: string | number): Element => {
    const elem = xmlDoc.createElement(name)
    elem.textContent = String(value)
    elem.setAttribute('__type', typeof value === 'number' ? 's32' : 'str')
    return elem
  }

  root.appendChild(createElement('seq_version', seq9.seq_version))

  const infoElem = xmlDoc.createElement('info')
  infoElem.appendChild(createElement('time_unit', seq9.info.time_unit))
  infoElem.appendChild(createElement('end_tick', seq9.info.end_tick))

  const bpmInfoElem = xmlDoc.createElement('bpm_info')
  seq9.info.bpm_info.bpm.forEach(bpm => {
    const bpmElem = xmlDoc.createElement('bpm')
    bpmElem.appendChild(createElement('tick', bpm.tick))
    bpmElem.appendChild(createElement('bpm', bpm.bpm * 100))
    bpmInfoElem.appendChild(bpmElem)
  })
  infoElem.appendChild(bpmInfoElem)

  const measureInfoElem = xmlDoc.createElement('measure_info')
  seq9.info.measure_info.measure.forEach(measure => {
    const measureElem = xmlDoc.createElement('measure')
    measureElem.appendChild(createElement('tick', measure.tick))
    measureElem.appendChild(createElement('num', measure.num))
    measureElem.appendChild(createElement('denomi', measure.denomi))
    measureInfoElem.appendChild(measureElem)
  })
  infoElem.appendChild(measureInfoElem)

  root.appendChild(infoElem)

  const sequenceDataElem = xmlDoc.createElement('sequence_data')
  seq9.sequence_data.step.forEach(step => {
    const stepElem = xmlDoc.createElement('step')
    stepElem.appendChild(createElement('start_tick', step.start_tick))
    stepElem.appendChild(createElement('end_tick', step.end_tick))
    stepElem.appendChild(createElement('left_pos', step.left_pos))
    stepElem.appendChild(createElement('right_pos', step.right_pos))
    stepElem.appendChild(createElement('kind', step.kind))
    stepElem.appendChild(createElement('player_id', step.player_id))

    if (step.long_point) {
      const longPointElem = xmlDoc.createElement('long_point')
      step.long_point.point.forEach(point => {
        const pointElem = xmlDoc.createElement('point')
        pointElem.appendChild(createElement('tick', point.tick))
        pointElem.appendChild(createElement('left_pos', point.left_pos))
        pointElem.appendChild(createElement('right_pos', point.right_pos))
        if (point.left_end_pos !== undefined) {
          pointElem.appendChild(createElement('left_end_pos', point.left_end_pos))
        }
        if (point.right_end_pos !== undefined) {
          pointElem.appendChild(createElement('right_end_pos', point.right_end_pos))
        }
        longPointElem.appendChild(pointElem)
      })
      stepElem.appendChild(longPointElem)
    }
    sequenceDataElem.appendChild(stepElem)
  })
  root.appendChild(sequenceDataElem)
  const extendDataElem = xmlDoc.createElement('extend_data')
  seq9.extend_data.extend.forEach(extend => {
    const extendElem = xmlDoc.createElement('extend')
    extendElem.appendChild(createElement('type', extend.type))
    extendElem.appendChild(createElement('tick', extend.tick))

    const paramElem = xmlDoc.createElement('param')
    paramElem.appendChild(createElement('time', extend.param.time))
    paramElem.appendChild(createElement('kind', extend.param.kind))
    paramElem.appendChild(createElement('layer_name', extend.param.layer_name))
    paramElem.appendChild(createElement('id', extend.param.id))
    paramElem.appendChild(createElement('lane', extend.param.lane))
    paramElem.appendChild(createElement('speed', extend.param.speed))

    if (extend.param.color) {
      const colorElem = xmlDoc.createElement('color')
      colorElem.appendChild(createElement('red', extend.param.color.red))
      colorElem.appendChild(createElement('green', extend.param.color.green))
      colorElem.appendChild(createElement('blue', extend.param.color.blue))
      paramElem.appendChild(colorElem)
    }

    extendElem.appendChild(paramElem)
    extendDataElem.appendChild(extendElem)
  })
  root.appendChild(extendDataElem)
  const recDataElem = xmlDoc.createElement('rec_data')
  const clipElem = xmlDoc.createElement('clip')
  clipElem.appendChild(createElement('start_time', seq9.rec_data.clip.start_time))
  clipElem.appendChild(createElement('end_time', seq9.rec_data.clip.end_time))
  recDataElem.appendChild(clipElem)
  seq9.rec_data.effect.forEach(effect => {
    const effectElem = xmlDoc.createElement('effect')
    effectElem.appendChild(createElement('tick', effect.tick))
    effectElem.appendChild(createElement('time', effect.time))
    effectElem.appendChild(createElement('command', effect.command))
    recDataElem.appendChild(effectElem)
  })
  root.appendChild(recDataElem)
  xmlDoc.appendChild(root)
  return '<?xml version="1.0" encoding="utf-8"?>' + (new XMLSerializer().serializeToString(xmlDoc))
}
