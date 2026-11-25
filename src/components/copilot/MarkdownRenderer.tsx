import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Helper to format inline markdown: bold, italic, code
  const renderInline = (text: string): React.ReactNode[] => {
    // Split by code `...`, bold **...** (allowing inner single *), and italic *...*
    const tokens: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*(?:[^*]|\*(?!\*))+?\*\*|\*[^*\n]+?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(text.substring(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('`') && matchText.endsWith('`')) {
        tokens.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] font-mono text-[11px] text-graphite-lightText dark:text-graphite-text border border-black/[0.05] dark:border-white/[0.05]"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith('**') && matchText.endsWith('**')) {
        tokens.push(
          <strong key={match.index} className="font-semibold text-graphite-lightText dark:text-graphite-text">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        tokens.push(
          <em key={match.index} className="italic text-graphite-lightSecondary dark:text-graphite-secondary">
            {matchText.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push(text.substring(lastIndex));
    }

    return tokens;
  };

  interface ListEntry {
    indent: number;
    ordered: boolean;
    text: string;
  }

  const parseTableRow = (rowLine: string): string[] => {
    const trimmedRow = rowLine.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmedRow.split('|').map(cell => cell.trim());
  };

  const isTableSeparator = (rowLine: string): boolean => {
    const cells = parseTableRow(rowLine);
    return cells.length >= 1 && cells.every(c => /^:?-{2,}:?$/.test(c));
  };

  const renderListBlock = (items: ListEntry[], keyPrefix: string): React.ReactNode => {
    if (items.length === 0) return null;
    const baseIndent = items[0].indent;
    const groups: { ordered: boolean; entries: { text: string; children: ListEntry[] }[] }[] = [];

    let i = 0;
    while (i < items.length) {
      const current = items[i];
      const children: ListEntry[] = [];
      let j = i + 1;
      while (j < items.length && items[j].indent > baseIndent) {
        children.push(items[j]);
        j++;
      }

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.ordered === current.ordered) {
        lastGroup.entries.push({ text: current.text, children });
      } else {
        groups.push({ ordered: current.ordered, entries: [{ text: current.text, children }] });
      }
      i = j;
    }

    return (
      <React.Fragment key={keyPrefix}>
        {groups.map((group, gIdx) => {
          const ListTag = group.ordered ? 'ol' : 'ul';
          const listClass = group.ordered
            ? 'space-y-1 my-2 pl-4 list-decimal marker:text-primary'
            : 'space-y-1 my-2 pl-4 list-disc marker:text-primary';

          return (
            <ListTag key={`${keyPrefix}-${gIdx}`} className={listClass}>
              {group.entries.map((entry, eIdx) => (
                <li key={eIdx} className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary leading-relaxed">
                  {renderInline(entry.text)}
                  {entry.children.length > 0 && renderListBlock(entry.children, `${keyPrefix}-${gIdx}-${eIdx}`)}
                </li>
              ))}
            </ListTag>
          );
        })}
      </React.Fragment>
    );
  };

  // Split into lines and parse block structures
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: ListEntry[] = [];
  let tableBuffer: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(renderListBlock(currentList, `list-${key}`));
      currentList = [];
    }
  };

  const flushTable = (key: number) => {
    if (tableBuffer.length === 0) return;

    if (tableBuffer.length >= 2 && isTableSeparator(tableBuffer[1])) {
      const headers = parseTableRow(tableBuffer[0]);
      const bodyRows = tableBuffer.slice(2).map(parseTableRow);

      elements.push(
        <div
          key={`table-${key}`}
          className="overflow-x-auto my-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08]"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-graphite-lightRaised dark:bg-graphite-raised border-b border-black/[0.08] dark:border-white/[0.08]">
              <tr>
                {headers.map((header, hIdx) => (
                  <th
                    key={hIdx}
                    className="py-1.5 px-2.5 font-mono font-semibold text-[11px] text-graphite-lightText dark:text-graphite-text whitespace-nowrap"
                  >
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-1.5 px-2.5 text-graphite-lightSecondary dark:text-graphite-secondary font-mono tabular"
                    >
                      {renderInline(row[cIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      tableBuffer.forEach((rawLine, idx) => {
        elements.push(
          <p
            key={`table-fallback-${key}-${idx}`}
            className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary leading-relaxed my-1.5"
          >
            {renderInline(rawLine.trim())}
          </p>
        );
      });
    }

    tableBuffer = [];
  };

  const flushCodeBlock = (key: number) => {
    elements.push(
      <pre
        key={`code-${key}`}
        className="my-2 p-3 rounded-lg bg-black/[0.04] dark:bg-black/40 border border-black/[0.08] dark:border-white/[0.08] overflow-x-auto"
      >
        <code className="font-mono text-[11px] text-graphite-lightText dark:text-graphite-text whitespace-pre">
          {codeLines.join('\n')}
        </code>
      </pre>
    );
    codeLines = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushList(index);
      flushTable(index);
      if (inCodeBlock) {
        flushCodeBlock(index);
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (trimmed.startsWith('|')) {
      flushList(index);
      tableBuffer.push(line);
      return;
    }

    flushTable(index);

    const listMatch = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (listMatch) {
      currentList.push({
        indent: listMatch[1].length,
        ordered: /^\d+\./.test(listMatch[2]),
        text: listMatch[3]
      });
      return;
    }

    flushList(index);

    if (!trimmed) {
      return;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${index}`}
          className="text-[11px] font-mono font-semibold tracking-wide text-graphite-lightText dark:text-graphite-text mt-2.5 mb-1 uppercase"
        >
          {renderInline(trimmed.slice(5))}
        </h4>
      );
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${index}`}
          className="text-xs font-mono font-semibold tracking-wide text-graphite-lightText dark:text-graphite-text mt-3 mb-1 uppercase"
        >
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${index}`}
          className="text-sm font-semibold tracking-tight text-graphite-lightText dark:text-graphite-text mt-3.5 mb-1.5"
        >
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${index}`}
          className="text-base font-semibold tracking-tight text-graphite-lightText dark:text-graphite-text mt-4 mb-2"
        >
          {renderInline(trimmed.slice(2))}
        </h2>
      );
    } else {
      elements.push(
        <p
          key={`p-${index}`}
          className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary leading-relaxed my-1.5"
        >
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  if (inCodeBlock) {
    flushCodeBlock(lines.length);
  }
  flushTable(lines.length);
  flushList(lines.length);

  return <div className={`space-y-1 text-xs ${className}`}>{elements}</div>;
};
