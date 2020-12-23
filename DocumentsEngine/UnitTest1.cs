using NUnit.Framework;
using DocumentsEngine;
using System.Collections.Generic;

namespace DocumentsEngineTests
{
    public class Tests
    {
        MemoryStorage _ms = new MemoryStorage();

        [SetUp]
        public void Setup()
        {
            
        }

        private void _addHelper(Document doc, MemoryStorage ms)
        {
            bool success;
            // This is wrong on so many levels, but otherwise I can't actually test it without removing the random throw.
            do
            {
                success = true;
                try
                {
                   ms.SaveDocument(doc);
                }
                catch
                {
                    success = false;
                }
            } while (success == false);
        }


        [Test]
        public void InsertFirst()
        {
            Document doc = new Document();
            this._addHelper(doc, _ms);
            Assert.AreEqual(1, doc.Id);
        }

        [Test]
        public void InsertTwoNewMS()
        {
            Document doc = new Document();
            var ms2 = new MemoryStorage();
            this._addHelper(doc, ms2);
            Document doc2 = new Document();
            this._addHelper(doc2, ms2);
            Assert.AreEqual(2, doc2.Id);
        }

        [Test]
        public void getTest()
        {
            Document doc = new Document()
            {
                Title = "T1",
                TotalAmount = 20,
            };
            Document doc2 = new Document()
            {
                Title = "T2",
                TotalAmount = 30,
            };

            var ms = new MemoryStorage();
            this._addHelper(doc, ms);
            this._addHelper(doc2, ms);

            Document r = ms.GetDocument(2);
            Assert.AreEqual("T2", r.Title);
        }

        [Test]
        public void ListTest()
        {
            Document doc = new Document() { 
                Title = "T1",
                TotalAmount = 20,
            };
            Document doc2 = new Document()
            {
                Title = "T2",
                TotalAmount = 30,
            };

            var ms = new MemoryStorage();
            this._addHelper(doc, ms);
            this._addHelper(doc2, ms);

            List<Document> testList = new List<Document>();
            testList.Add(doc);
            testList.Add(doc2);

            CollectionAssert.AreEquivalent(testList, ms.GetAllDocuments());
        }


        [Test]
        public void deleteTest()
        {
            Document doc = new Document()
            {
                Title = "T1",
                TotalAmount = 20,
            };
            Document doc2 = new Document()
            {
                Title = "T2",
                TotalAmount = 30,
            };

            var ms = new MemoryStorage();
            this._addHelper(doc, ms);
            this._addHelper(doc2, ms);
            ms.DeleteDocument(2);

            List<Document> testList = new List<Document>();
            testList.Add(doc);

            CollectionAssert.AreEquivalent(testList, ms.GetAllDocuments());
        }






    }


}