<<<<<<< HEAD
// src/pages/_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Fonts, analytics, CSP meta tags can go here */}
        </Head>
=======
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
<<<<<<< HEAD
}

export default MyDocument;
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
