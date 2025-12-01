export default function CompanyProfileGuide() {
  return (
    <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="px-5 py-4 border-b bg-neutral-50">
        <h3 className="text-sm font-semibold text-neutral-900">入力のコツ</h3>
        <p className="text-xs text-neutral-600 mt-1">候補者が企業理解しやすい情報を添えましょう。</p>
      </div>
      <div className="px-5 py-4 space-y-4">
        <section>
          <h4 className="text-xs font-semibold text-indigo-700 mb-2">効果的な会社紹介</h4>
          <ul className="list-disc pl-4 text-sm text-neutral-800 space-y-1">
            <li>事業のミッション・提供価値を明確に</li>
            <li>働き方やカルチャーを具体例で示す</li>
            <li>学生に期待する役割や活躍シーンを記載</li>
          </ul>
        </section>
        <section>
          <h4 className="text-xs font-semibold text-indigo-700 mb-2">URL記載のポイント</h4>
          <ul className="list-disc pl-4 text-sm text-neutral-800 space-y-1">
            <li>コーポレート/採用ページの両方を案内</li>
            <li>最新情報の掲載があるものを優先</li>
          </ul>
        </section>
        <section>
          <h4 className="text-xs font-semibold text-indigo-700 mb-2">注意事項</h4>
          <p className="text-sm text-neutral-700">秘匿情報や未公開情報の記載は避けてください。</p>
        </section>
      </div>
    </div>
  );
}

