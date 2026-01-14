import { randomBytes } from 'crypto'

export function gerarTokenTroca(): string {
  return randomBytes(32).toString('hex')
}

