// Minimal CSV generator. No dependencies. Handles commas, quotes, newlines.

export type CsvColumn<T> = {
  header: string
  accessor: (row: T) => string | number | null | undefined
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // RFC 4180: wrap in quotes if value contains comma, quote, or newline.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(c.accessor(row))).join(',')
  )
  // BOM so Excel opens UTF-8 correctly.
  return '﻿' + [header, ...lines].join('\r\n')
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}
