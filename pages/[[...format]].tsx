import { createFFmpeg, fetchFile, FFmpeg } from "@ffmpeg/ffmpeg";
import { saveAs } from "file-saver";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";
import styles from "../styles/Home.module.css";

const extensions = ["mp4", "webm", "avi", "wmv", "mov"];

export async function getStaticProps(context: { params: { format: any[] } }) {
  const format = context.params.format?.[0];

  if(!format || extensions.indexOf(format) === -1) {
    return {
      redirect: {
        destination: '/mp4',
        permanent: false,
      },
    }
  }

  return {
    props: { format }
  };
}

export async function getStaticPaths() {
  return {
    paths: extensions.map((ext) => ({ params: { format: [ext] } })),
    fallback: true,
  };
}

const Home: NextPage<{format: string}> = ({ format }) => {
  const router = useRouter();
  let [progress, setProgress] = useState(0);
  let extension = format;
  let ffmpeg: FFmpeg | null = null;

  const transcode = async ({
    target: { files },
  }: ChangeEvent<HTMLInputElement>) => {
    if (ffmpeg === null) {
      ffmpeg = createFFmpeg({
        log: true,
        corePath: "/ffmpeg-core/dist/ffmpeg-core.js",
      });
    }
    const message = document.getElementById("message");
    if (files == null || files.length <= 0)
      return window.alert("No file picked");
    const { name } = files[0];
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    ffmpeg.FS("writeFile", name, await fetchFile(files[0]));
    ffmpeg.setProgress(({ ratio }) => {
      setProgress(ratio);
    });
    await ffmpeg.run("-i", name, `output.${extension}`);
    const data = ffmpeg.FS("readFile", `output.${extension}`);

    const blob = new Blob([data.buffer], { type: `video/${extension}` });
    saveAs(blob, `output.${extension}`);
  };

  const cancel = () => {
    try {
      if (ffmpeg != null) ffmpeg.exit();
    } catch (e) {}
    ffmpeg = null;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Convert To</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700&display=swap"
          rel="stylesheet"
        ></link>
      </Head>

      <main className={styles.main}>
        <div className="mb-5 flex flex-row flex-nowrap items-center">
          <h1 className="font-bold text-2xl whitespace-nowrap">
            {"Convert to ."}
          </h1>
          <select
            id="extensions"
            className="bg-gray-50 border border-gray-300 text-gray-900 font-bold sm:text-xl rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={({ target: { value } }) => {
              router.push(`/${value}`);
            }}
            value={extension}
          >
            {extensions.map((ext) => (
              <option key={ext}>{ext}</option>
            ))}
          </select>
        </div>

        <input
          type="file"
          id="uploader"
          accept="video/*"
          className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onChange={(e) => {
            transcode(e);
          }}
        ></input>
        <div className="mt-5" />
        <div className="w-64 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${(progress * 100).toFixed(1)}%` }}
          ></div>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;