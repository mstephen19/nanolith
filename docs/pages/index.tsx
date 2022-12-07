import Head from 'next/head';
// import Image from 'next/image';

export default function Home() {
    return (
        <div>
            <Head>
                <title>Some title</title>
                <meta name='description' content='Shit' />
                <link rel='icon' href='/favicon.ico' />
            </Head>
        </div>
    );
}
