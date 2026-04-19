"use client";

export default function UploadBox({ setFile }: any) {
    return (
        <div className="border-2 border-dashed border-gray-600 p-6 rounded text-center">
            <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="text-gray-300"
            />
            <p className="text-sm text-gray-500 mt-2">
                Upload a disaster scene image
            </p>
        </div>
    );
}