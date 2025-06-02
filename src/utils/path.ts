import {isIndexSegment, isIndexTuple, isKeySegment, type Path} from '@sanity/types'

export declare type IndexTuple = [number | '', number | '']

export declare type KeyedSegment = {
  _key: string
}

export declare type PathSegment = string | number | KeyedSegment | IndexTuple

export declare type AgentActionPathSegment = string | KeyedSegment

export declare type AgentActionPath = AgentActionPathSegment[]

const rePropName =
  /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reAgentPropName =
  /[^.[\]]+|\[(?:(["'])((?:(?!\1)[^\\]|\\.)*?)\1)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reKeySegment = /_key\s*==\s*['"](.*)['"]/

export function stringToPath(path: string): Path {
  const segments = path.match(rePropName)
  if (!segments || segments.some((s) => !s)) {
    throw new Error(`Invalid path string: "${path}"`)
  }

  return segments.map(normalizePathSegment)
}

export function stringToAgentPath(path: string): AgentActionPath {
  const segments = path.match(reAgentPropName)
  if (!segments || segments.some((s) => !s)) {
    throw new Error(`Invalid path string: "${path}"`)
  }

  return segments.filter((segment) => !isIndexSegment(segment)).map(normalizeAgentPathSegment)
}

export function normalizePathSegment(segment: string): PathSegment {
  if (isIndexSegment(segment)) {
    return normalizeIndexSegment(segment)
  }

  if (isKeySegment(segment)) {
    return normalizeKeySegment(segment)
  }

  if (isIndexTuple(segment)) {
    return normalizeIndexTupleSegment(segment)
  }

  return segment
}

export function normalizeAgentPathSegment(segment: string): AgentActionPathSegment {
  if (isKeySegment(segment)) {
    return normalizeKeySegment(segment)
  }

  return segment
}

export function normalizeIndexSegment(segment: string): PathSegment {
  return Number(segment.replace(/[^\d]/g, ''))
}

/** @internal */
export function normalizeKeySegment(segment: string): KeyedSegment {
  const segments = segment.match(reKeySegment)
  if (!segments) {
    throw new Error(`Invalid key segment: ${segment}`)
  }

  return {_key: segments[1]}
}

/** @internal */
export function normalizeIndexTupleSegment(segment: string): IndexTuple {
  const [from, to] = segment.split(':').map((seg) => (seg === '' ? seg : Number(seg)))
  return [from, to]
}

export function pathToString(fieldPath: Path) {
  let stringPath = ''
  for (let i = 0; i < fieldPath.length; i++) {
    const segment = fieldPath[i]
    if (isKeySegment(segment)) {
      stringPath += `[_key=="${segment._key}"]`
    } else if (typeof segment === 'number') {
      stringPath += `[${segment}]`
    } else {
      stringPath += (stringPath.length ? '.' : '') + segment
    }
  }
  return stringPath
}
