/**
 * TrademarkNotice — site-wide footer fine print (N6). We reference model,
 * company, and product names only to identify compatibility; this disclaims
 * any affiliation or endorsement. Rendered in every footer.
 */
export function TrademarkNotice({ className }: { className?: string }) {
  return (
    <p className={`text-[10px] leading-relaxed text-[#6b6f78] ${className ?? ''}`}>
      All model, company, and product names are trademarks of their respective owners, used only to identify
      compatibility. No affiliation or endorsement is implied.
    </p>
  );
}
