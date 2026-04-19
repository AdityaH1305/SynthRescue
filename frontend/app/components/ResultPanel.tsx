export default function ResultPanel({ result }: any) {
    if (!result) {
        return <p className="text-gray-500">No results yet.</p>;
    }

    return (
        <div className="bg-black p-4 rounded border border-gray-700">
            <pre className="text-sm text-green-400 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
            </pre>
        </div>
    );
}