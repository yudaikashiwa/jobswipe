export default function StudentProfileGuide() {
  return (
    <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="px-5 py-4 border-b bg-neutral-50">
        <h3 className="text-sm font-semibold text-neutral-900">入力のコツ</h3>
        <p className="text-xs text-neutral-600 mt-1">採用担当が見やすいポイントを押さえましょう。</p>
      </div>
      <div className="px-5 py-4 space-y-4">
        <section>
          <h4 className="text-xs font-semibold text-indigo-700 mb-2">良い自己紹介の例</h4>
          <ul className="list-disc pl-4 text-sm text-neutral-800 space-y-1">
            <li>具体的な数値（期間・件数・成果）を含める</li>
            <li>役割や工夫点を短く明確に記載する</li>
            <li>興味関心と将来やりたいことに触れる</li>
          </ul>
        </section>
        <section>
          <h4 className="text-xs font-semibold text-indigo-700 mb-2">避けたい書き方</h4>
          <ul className="list-disc pl-4 text-sm text-neutral-800 space-y-1">
            <li>抽象的な表現だけで具体性がない</li>
            <li>改行がなく読みづらい長文</li>
            <li>個人情報の過度な記載</li>
          </ul>
        </section>
        <section>
          <h4 className="text-xs font-semibold text-indigo-700 mb-2">プライバシー</h4>
          <p className="text-sm text-neutral-700">住所や電話番号などの機微情報は記載しないでください。</p>
        </section>
      </div>
    </div>
  );
}

