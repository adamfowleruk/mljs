
    Function                                      Test                  Status
Driver configuration

    mldb Constructor                              all                   PASS
    mldb.configure                                009-configure         PASS
    mldb.setLogger                                all                   PASS

Database Management

    mldb.exists (aka mldb.test)                   004-create-destroy    PASS
    mldb.create                                   004-create-destroy    PASS
    mldb.destroy                                  004-create-destroy    PASS

Document management

    mldb.get                                      001-save-get-delete   PASS
    mldb.metadata                                 004-metadata          PASS
    mldb.save                                     001-save-get-delete   PASS
    mldb.merge                                    005-merge             PASS
    mldb.delete (aka mldb.remove)                 001-save-get-delete   PASS

Search

    mldb.collect                                  005-collections       PASS
    mldb.list                                     006-directory         PASS
    mldb.keyvalue                                 001-keyvalue          PASS
    mldb.search                                   003-search-query      PASS
    mldb.structuredSearch                         002-structured-search PASS

ACID Transactions

    mldb.beginTransaction (aka mldb.begin)        001-basic-trans       PASS
    mldb.commitTransaction (aka mldb.commit)      001-basic-trans       PASS
    mldb.rollbackTransaction (aka mldb.rollback)  003-rollback          PASS

REST API Extensions

    mldb.do                                       001-do                PASS
    mldb.subscribe                                NOT STARTED
    mldb.unsubscribe                              NOT STARTED

Utility functions

    mldb.fast                                     TEST - with saveAll
    mldb.ingestcsv                                NOT STARTED
    mldb.saveAll                                  NOT STARTED
