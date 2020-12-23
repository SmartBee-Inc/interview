using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;

namespace DocumentsEngine
{

    public class MemoryStorage : IMemoryStorage
    {

        // Assuming the storage is responsible for the key assignment, thought the return of void on 
        // SaveDocument implys otherwise, the throw message implies that we do generate. 
        // Either way the change is minor. 
        private int currentKey = 0;
        private static Mutex keyMut = new Mutex();

        // Preventing two competing updates, discount and regular, so that a x > discount amount will not get updated to x <= discount while discount in progress.
        private static Mutex updateMut = new Mutex();

        private Dictionary<int, Document> _dataStore = new Dictionary<int, Document>();

        public void SaveDocument(Document document)
        {
            Random rnd = new Random();
            if (rnd.Next(1, 11) > 5)
            {
                Thread.Sleep(1000);
                // ToDo: Store in memory here

                keyMut.WaitOne();
                document.Id = ++currentKey;
                keyMut.ReleaseMutex();
                //if (dataStore == null) new Exception(" dataStore == null in Save ");
                _dataStore.Add(document.Id, document);
                return;
            } // Else.. 
            throw new Exception("Failed to generate document");
        }

        public Document GetDocument(int id)
        {
            Document doc = null;
            _dataStore.TryGetValue(id, out doc);
            return doc;
        }

        public bool DeleteDocument(int id)
        {
            return _dataStore.Remove(id);
        }

        // Signature? Shouldn't be List<Document> or similar.
        //public Document GetAllDocuments()
        public List<Document> GetAllDocuments()
        {
            return _dataStore.Values.Cast<Document>().ToList();
        }

        public List<int> GetAllDocumentsIds()
        {
            return _dataStore.Keys.Cast<int>().ToList();
        }

        public void UpdateDocumentAmount(int docId, decimal newAmount)
        {
            Document doc = null;
            updateMut.WaitOne();
            _dataStore.TryGetValue(docId, out doc);
            if (doc != null)
            {
                doc.TotalAmount = newAmount;
            }
            updateMut.ReleaseMutex();
        }

        /// <summary>
        /// Reduce the discountAmount from the current amount
        /// </summary>
        /// <param name="docId"></param>
        /// <param name="discountAmount"></param>
        public void DocumentAmountDiscount(int docId, decimal discountAmount, int updateTreshold = -1)
        {
            Document doc = null;
            updateMut.WaitOne();
            _dataStore.TryGetValue(docId, out doc);
            if (doc != null && doc.TotalAmount > discountAmount && (updateTreshold == -1 || updateTreshold == doc.UpdateCounter))   
            {  
                doc.TotalAmount = doc.TotalAmount - discountAmount;
            }
            updateMut.ReleaseMutex();
        }
    }
}


