# Changelog

## 0.6.7

* Updated to @rappopo/dab@0.6.13
* Bug fix: collections still using the old `withSchema` options
* Adding support for `array` & `object` column type
* Index management

## 0.6.6

* Updated to @rappopo/dab@0.6.12

## 0.6.5

* Updated to @rappopo/dab@0.6.11

## 0.6.3

* Updated to @rappopo/dab@0.6.10

## 0.6.2

* Updated to @rappopo/dab@0.6.9
* Updated to knex@0.15.2
* Standard JS compliance

## 0.6.1

* Updated to @rappopo/dab@0.6.1

## 0.5.1

* Updated to @rappopo/dab@0.5.1
* Rewrite sort to match the new spec

## 0.5.0

* Updated to @rappopo/dab@0.5.0

## 0.4.0

* Updated to @rappopo/dab@0.4.0

## 0.3.0

* Updated to @rappopo/dab@0.3.0

## 0.2.3

* Updated to @rappopo/dab@0.2.3

## 0.2.2

* Updated to @rappopo/dab@0.2.2 specs

## 0.2.1

* Updated to @rappopo/dab@0.2.1 specs

## 0.2.0

* Updated to @rappopo/dab@0.2.0 specs

## 0.1.2

* Updated to @rappopo/dab@0.1.1 specs

## 0.1.1

* Fix bug on proxying knex's error to dab
* Added withSchema to params in createCollection(), renameCollection() and removeCollection()

## 0.1.0

* Updated to @rappopo/dab@0.1.0 and enforce new specs

## 0.0.8

* Updated to @rappopo/dab@0.0.13

## 0.0.7

* Updated to @rappopo/dab@0.0.11

## 0.0.6

* Updated to @rappopo/dab@0.0.8
* Removing idSrc & idDest in favor of schema mask provided by @rappopo/dab

## 0.0.5

* withDetail params in all bulk methods
* Updated to @rappopo/dab@0.0.6 to have copyFrom & copyTo for free

## 0.0.4

* Spec changed on bulkRemove

## 0.0.3

* Adding .asCallback to the Promise
* Adding bulkCreate method
* Adding bulkUpdate method
* Adding bulkRemove method

## 0.0.2

* Code cleanup

## 0.0.1

* First commit ever
* Support the most basic methods:
  * find
  * findOne
  * create
  * update
  * remove