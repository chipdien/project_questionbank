import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import VariationTableRenderer from './VariationTableRenderer';

interface SafeMarkdownProps {
  children: string | null | undefined;
  className?: string;
}

export default function SafeMarkdown({ children, className }: SafeMarkdownProps) {
  if (!children) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            if (language === 'bbt') {
              return (
                <VariationTableRenderer
                  dataString={String(children).replace(/\n$/, '')}
                />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
