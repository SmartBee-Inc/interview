using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace DocumentsEngine
{


    public class DocumentsService
    {

        private MemoryStorage _ms = new MemoryStorage();
        Thread _discountThread;

        // All these threads should be Tasks if the tasks are green N:M threads, and the threads are system threads. 
        // Otherwise I'll have 1k threads, which can explode on 32bit (and a bad thing in any case).
        // But it's Thread.Sleep and not Task.Delay in the "add lag", so going with threads.
        public DocumentsService()
        {
            DocumentsDiscountService ds = new DocumentsDiscountService();
            _discountThread = new Thread(new ThreadStart(ds.StartMakingDiscounts));
            _discountThread.Start();
        }

        ~DocumentsService()
        {
            _discountThread.Abort();
        }

        private void _addRetry(Document document)
        {
            // Fancy locks on discount update, but someone can just keep the reference and update it from outside the service?
            // Can create the documents in the Service instead. 
            var newDocument = document.ShallowCopy();
            int counter = 0;
            bool success;
            do
            {
                success = true;
                try
                {
                    _ms.SaveDocument(document);
                }
                catch (System.Exception e)
                {
                    success = false;
                    counter++;
                    Thread.Sleep(counter * 100);
                }
            } while (success == false && counter < 20);
        }

        public void add(Document document)
        {
            Thread thread = new Thread(new ThreadStart( () => _addRetry(document) ));
            thread.Start(document);
        }

        public void update(Document document)
        {
            // Can be done in a thread, but it's the same idea..
            
            var doc = _ms.GetDocument(document.Id);

            // Since I can't add Update to the memory storage, two options, get, modify and reinsert, or just update the fields. 
            // Since the fields I care about are primitives, I'll update the fields. Looks bad thought.
            doc.TotalAmount = document.TotalAmount;
            doc.Title = document.Title;
            doc.Updated();
        }

        public bool delete(int Id)
        {
            return _ms.DeleteDocument(Id);
        }

        // In general this is the more interesting signature, it allows a "delete all that match the fields" implementation for example. 
        public bool delete(Document document)
        {
            return _ms.DeleteDocument(document.Id);
        }

        public List<Document> listDocuments()
        {
            return _ms.GetAllDocuments();
        }

    }
}
